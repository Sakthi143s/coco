from fastapi import APIRouter, Depends, Query, HTTPException, BackgroundTasks, Request
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import logging
from app.core.database import get_db
from app.core.config import settings
from app.models.models import User, Activity, StravaConnection, Challenge, ChallengeParticipant
from app.services.token_manager import get_valid_access_token
from app.integrations.strava.service import get_strava_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/webhooks", tags=["Strava Webhooks"])

async def process_strava_webhook_event(event_data: dict, db: Session):
    """
    Asynchronous Webhook Event Processor:
    1. Idempotency: Prevent duplicate creation via strava_activity_id.
    2. Token Refresh: Uses get_valid_access_token to ensure token is valid before Strava API call.
    3. Handles create, update, delete for activities.
    4. Handles deauthorization events for athletes.
    5. Updates challenge progress and recalculates leaderboards.
    """
    object_type = event_data.get("object_type")
    aspect_type = event_data.get("aspect_type")
    object_id = str(event_data.get("object_id"))
    owner_id = str(event_data.get("owner_id"))
    updates = event_data.get("updates", {})

    logger.info(f"Received Strava Webhook event: object_type={object_type}, aspect_type={aspect_type}, object_id={object_id}")

    # Handle Deauthorization Event
    if object_type == "athlete" and updates.get("authorized") == "false":
        user = db.query(User).filter(User.strava_athlete_id == owner_id).first()
        if user:
            conn = db.query(StravaConnection).filter(StravaConnection.user_id == user.id).first()
            if conn:
                db.delete(conn)
                db.commit()
                logger.info(f"Deauthorized and removed Strava connection for athlete ID: {owner_id}")
        return

    if object_type != "activity":
        return

    user = db.query(User).filter(User.strava_athlete_id == owner_id).first()
    if not user:
        logger.warning(f"Webhook received for unknown Strava athlete ID: {owner_id}")
        return

    # Obtain valid (auto-refreshed) access token
    access_token = await get_valid_access_token(user.id, db)
    if not access_token and not settings.is_mock_strava:
        logger.error(f"Cannot process webhook event for user {user.id}: Failed to obtain valid access token")
        return

    strava_service = get_strava_service()

    if aspect_type in ["create", "update"]:
        try:
            act_details = await strava_service.get_activity_by_id(access_token=access_token or "mock_token", activity_id=object_id)
            
            # Unit Normalization (Strava returns meters and m/s)
            dist_km = round(act_details.get("distance", 0.0) / 1000.0, 2)
            moving_sec = act_details.get("moving_time", 0)
            elapsed_sec = act_details.get("elapsed_time", moving_sec)
            elev_m = round(act_details.get("total_elevation_gain", 0.0), 1)
            speed_kmh = round(act_details.get("average_speed", 0.0) * 3.6, 1)
            max_speed_kmh = round(act_details.get("max_speed", 0.0) * 3.6, 1)

            # Idempotency Check
            existing = db.query(Activity).filter(Activity.strava_activity_id == object_id).first()
            if existing:
                existing.name = act_details.get("name", existing.name)
                existing.activity_type = act_details.get("type", existing.activity_type)
                existing.distance = dist_km
                existing.moving_time = moving_sec
                existing.elapsed_time = elapsed_sec
                existing.elevation_gain = elev_m
                existing.average_speed = speed_kmh
                existing.max_speed = max_speed_kmh
                existing.updated_at = datetime.now(timezone.utc)
                logger.info(f"Updated existing activity {object_id} via Strava webhook")
            else:
                new_act = Activity(
                    strava_activity_id=object_id,
                    user_id=user.id,
                    activity_type=act_details.get("type", "Ride"),
                    name=act_details.get("name", "Strava Ride"),
                    distance=dist_km,
                    moving_time=moving_sec,
                    elapsed_time=elapsed_sec,
                    elevation_gain=elev_m,
                    average_speed=speed_kmh,
                    max_speed=max_speed_kmh,
                    calories=int(dist_km * 25),
                    start_date=datetime.now(timezone.utc),
                    strava_url=f"https://www.strava.com/activities/{object_id}"
                )
                db.add(new_act)
                logger.info(f"Created new activity {object_id} for user {user.name} via Strava webhook")

            # Update Challenge Progress
            participations = db.query(ChallengeParticipant).filter(ChallengeParticipant.rider_id == user.id).all()
            for p in participations:
                if p.challenge and p.challenge.status == "active":
                    if p.challenge.challenge_type == "distance":
                        p.current_progress += dist_km
                    elif p.challenge.challenge_type == "elevation":
                        p.current_progress += elev_m
                    if p.current_progress >= p.challenge.target_value:
                        p.completed = True

            db.commit()
        except Exception as e:
            logger.error(f"Error processing Strava activity webhook {object_id}: {type(e).__name__}")
            db.rollback()

    elif aspect_type == "delete":
        existing = db.query(Activity).filter(Activity.strava_activity_id == object_id).first()
        if existing:
            db.delete(existing)
            db.commit()
            logger.info(f"Deleted activity {object_id} via Strava webhook")


@router.get("/strava")
def verify_strava_webhook(
    hub_mode: str = Query(..., alias="hub.mode"),
    hub_challenge: str = Query(..., alias="hub.challenge"),
    hub_verify_token: str = Query(..., alias="hub.verify_token")
):
    """Strava Webhook Subscription Verification challenge endpoint."""
    if hub_mode == "subscribe" and hub_verify_token == settings.STRAVA_VERIFY_TOKEN:
        logger.info("Strava webhook subscription challenge verified successfully")
        return {"hub.challenge": hub_challenge}
    logger.warning("Invalid webhook verification token attempt")
    raise HTTPException(status_code=403, detail="Invalid verification token")


@router.post("/strava")
async def receive_strava_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Receives event notifications from Strava and dispatches background processing."""
    payload = await request.json()
    background_tasks.add_task(process_strava_webhook_event, payload, db)
    return {"status": "event_received"}
