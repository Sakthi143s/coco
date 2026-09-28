from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from datetime import datetime, timezone
import logging
from app.core.database import get_db
from app.core.config import settings
from app.core.auth import get_current_user, get_current_user_optional
from app.models.models import Activity, User, StravaConnection
from app.schemas.schemas import ActivityResponse
from app.services.token_manager import get_valid_access_token
from app.integrations.strava.service import get_strava_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/activities", tags=["Activities"])

@router.get("", response_model=List[ActivityResponse])
def list_activities(
    rider_id: Optional[str] = None,
    user_id: Optional[str] = None,
    activity_type: Optional[str] = None,
    limit: int = Query(50, le=200),
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """
    Retrieves real club activities ordered by start date descending.
    """
    target_user_id = user_id or rider_id
    query = db.query(Activity).join(User, Activity.user_id == User.id)

    if target_user_id:
        query = query.filter(Activity.user_id == target_user_id)
    if activity_type and activity_type != "all":
        query = query.filter(Activity.activity_type == activity_type)

    activities = query.order_by(desc(Activity.start_date)).offset(offset).limit(limit).all()

    results = []
    for a in activities:
        results.append(
            ActivityResponse(
                id=a.id,
                strava_activity_id=a.strava_activity_id,
                user_id=a.user_id,
                rider_id=a.user_id,
                rider_name=a.user.name if a.user else "Unknown Rider",
                rider_avatar=a.user.avatar_url if a.user else None,
                activity_type=a.activity_type,
                name=a.name,
                activity_name=a.name,
                distance=round(a.distance, 2),
                moving_time=a.moving_time,
                elapsed_time=a.elapsed_time,
                elevation_gain=round(a.elevation_gain, 1),
                average_speed=round(a.average_speed, 1),
                max_speed=round(a.max_speed, 1) if a.max_speed else 0.0,
                calories=a.calories or 0,
                start_date=a.start_date,
                start_latitude=a.start_latitude,
                start_longitude=a.start_longitude,
                strava_url=a.strava_url,
                created_at=a.created_at,
                updated_at=a.updated_at
            )
        )

    return results


async def sync_activities_for_user(user: User, db: Session) -> dict:
    """Helper to perform Strava activity sync and upsert without duplicates."""
    access_token = await get_valid_access_token(user.id, db)
    if not access_token:
        conn = db.query(StravaConnection).filter(StravaConnection.user_id == user.id).first()
        if not conn:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No Strava account connected. Please connect your Strava account first."
            )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to obtain valid Strava access token. Please reconnect Strava."
        )

    strava_service = get_strava_service()
    
    # Retrieve recent activities with pagination (pages 1 to 2, 30 per page)
    raw_activities = []
    try:
        for page_num in range(1, 3):
            page_data = await strava_service.get_athlete_activities(
                access_token=access_token,
                page=page_num,
                per_page=30
            )
            if not page_data:
                break
            raw_activities.extend(page_data)
            if len(page_data) < 30:
                break
    except Exception as e:
        logger.error(f"Failed to fetch Strava activities for user {user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Error retrieving activities from Strava API: {str(e)}"
        )

    synced_count = 0
    updated_count = 0

    for raw in raw_activities:
        strava_act_id = str(raw.get("id"))
        if not strava_act_id:
            continue

        existing = db.query(Activity).filter(Activity.strava_activity_id == strava_act_id).first()
        
        dist_km = round(raw.get("distance", 0.0) / 1000.0, 2)
        moving_sec = int(raw.get("moving_time", 0))
        elapsed_sec = int(raw.get("elapsed_time", moving_sec))
        elev_m = round(raw.get("total_elevation_gain", 0.0), 1)
        speed_kmh = round(raw.get("average_speed", 0.0) * 3.6, 1)
        max_speed_kmh = round(raw.get("max_speed", 0.0) * 3.6, 1)
        act_name = raw.get("name", "Strava Ride")
        act_type = raw.get("type", "Ride")
        cal = int(raw.get("calories") or (dist_km * 25))

        # Handle start date
        raw_date = raw.get("start_date")
        if raw_date:
            start_dt = datetime.fromisoformat(raw_date.replace("Z", "+00:00"))
        else:
            start_dt = datetime.now(timezone.utc)

        coords = raw.get("start_latlng") or [None, None]
        start_lat = coords[0] if len(coords) > 0 else None
        start_lng = coords[1] if len(coords) > 1 else None
        strava_url = f"https://www.strava.com/activities/{strava_act_id}"

        if existing:
            # Update existing activity (idempotent, never creates duplicates)
            existing.name = act_name
            existing.activity_type = act_type
            existing.distance = dist_km
            existing.moving_time = moving_sec
            existing.elapsed_time = elapsed_sec
            existing.elevation_gain = elev_m
            existing.average_speed = speed_kmh
            existing.max_speed = max_speed_kmh
            existing.calories = cal
            existing.start_date = start_dt
            existing.start_latitude = start_lat
            existing.start_longitude = start_lng
            existing.strava_url = strava_url
            existing.updated_at = datetime.now(timezone.utc)
            updated_count += 1
        else:
            new_act = Activity(
                strava_activity_id=strava_act_id,
                user_id=user.id,
                name=act_name,
                activity_type=act_type,
                distance=dist_km,
                moving_time=moving_sec,
                elapsed_time=elapsed_sec,
                elevation_gain=elev_m,
                average_speed=speed_kmh,
                max_speed=max_speed_kmh,
                calories=cal,
                start_date=start_dt,
                start_latitude=start_lat,
                start_longitude=start_lng,
                strava_url=strava_url
            )
            db.add(new_act)
            synced_count += 1

    db.commit()
    total_count = db.query(Activity).filter(Activity.user_id == user.id).count()

    return {
        "message": f"Successfully synced {synced_count} new and updated {updated_count} Strava activities.",
        "new_activities": synced_count,
        "updated_activities": updated_count,
        "total_activities": total_count,
        "user_id": user.id
    }


@router.post("/sync")
async def sync_current_user_activities(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Syncs real Strava activities for the currently authenticated user.
    """
    return await sync_activities_for_user(current_user, db)


@router.post("/sync/{rider_id}")
async def sync_rider_activities(
    rider_id: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Syncs Strava activities for a specified rider ID.
    """
    user = db.query(User).filter(User.id == rider_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Rider not found")

    return await sync_activities_for_user(user, db)
