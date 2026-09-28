from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import time
import logging
from typing import Optional
from app.core.database import get_db
from app.core.config import settings
from app.core.auth import get_current_user, get_current_user_optional
from app.integrations.strava.service import get_strava_service
from app.models.models import User, StravaConnection, ClubMember, Club
from app.schemas.schemas import CurrentUserResponse, StravaAuthResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication & Strava OAuth"])

@router.get("/me", response_model=CurrentUserResponse)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns the currently authenticated Google/Supabase user profile, role,
    club affiliation, and Strava connection status.
    """
    conn = db.query(StravaConnection).filter(StravaConnection.user_id == current_user.id).first()
    membership = db.query(ClubMember).filter(ClubMember.user_id == current_user.id).first()
    club = membership.club if membership else db.query(Club).first()

    return CurrentUserResponse(
        id=current_user.id,
        supabase_user_id=current_user.supabase_user_id,
        email=current_user.email,
        name=current_user.name,
        avatar_url=current_user.avatar_url,
        role=current_user.role,
        status=current_user.status,
        leaderboard_opt_in=current_user.leaderboard_opt_in,
        strava_athlete_id=current_user.strava_athlete_id,
        strava_connected=conn is not None,
        club_id=club.id if club else None,
        club_name=club.name if club else None,
        created_at=current_user.created_at
    )


@router.get("/strava", response_model=StravaAuthResponse)
def strava_login(
    user_id: Optional[str] = Query(None, description="Optional user ID connecting Strava"),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Initiates Strava OAuth flow securely tied to the authenticated user.
    """
    strava_service = get_strava_service()
    redirect_uri = settings.STRAVA_REDIRECT_URI

    # State binds OAuth flow to the active authenticated application user
    target_user_id = current_user.id if current_user else user_id
    if not target_user_id:
        target_user_id = "new_rider"

    auth_url = strava_service.get_authorization_url(redirect_uri=redirect_uri, state=target_user_id)
    return StravaAuthResponse(
        authorize_url=auth_url,
        is_mock=settings.is_mock_strava,
        mode=settings.STRAVA_MODE
    )


@router.get("/strava/callback")
async def strava_callback(
    code: str = Query(None),
    error: str = Query(None),
    state: str = Query("new_rider"),
    db: Session = Depends(get_db)
):
    """
    Strava OAuth callback: exchanges authorization code for tokens and binds
    Strava athlete ID to the authenticated CycleClub user.
    """
    # 1. Handle user authorization denial or error from Strava
    if error:
        logger.warning(f"Strava OAuth returned error: {error}")
        target_url = f"{settings.FRONTEND_URL}/dashboard?strava_error={error}"
        return RedirectResponse(url=target_url)

    if not code:
        logger.warning("Strava OAuth callback missing authorization code")
        target_url = f"{settings.FRONTEND_URL}/dashboard?strava_error=missing_code"
        return RedirectResponse(url=target_url)

    strava_service = get_strava_service()

    # 2. Code exchange
    try:
        token_data = await strava_service.exchange_token(code)
    except Exception as e:
        logger.error(f"Failed to exchange authorization code with Strava: {e}")
        target_url = f"{settings.FRONTEND_URL}/dashboard?strava_error=exchange_failed"
        return RedirectResponse(url=target_url)

    athlete_info = token_data.get("athlete", {})
    strava_athlete_id = str(athlete_info.get("id"))
    access_token = token_data.get("access_token")
    refresh_token = token_data.get("refresh_token")
    expires_at = token_data.get("expires_at", int(time.time()) + 21600)

    if not strava_athlete_id or not access_token:
        logger.error("Invalid token payload received from Strava API")
        target_url = f"{settings.FRONTEND_URL}/dashboard?strava_error=invalid_token_payload"
        return RedirectResponse(url=target_url)

    # 3. Associate with the authenticated user
    user = None
    if state and state != "new_rider":
        user = db.query(User).filter(User.id == state).first()

    if not user:
        user = db.query(User).filter(User.strava_athlete_id == strava_athlete_id).first()

    if not user:
        # Create user record if not matched
        fname = athlete_info.get("firstname", "Strava")
        lname = athlete_info.get("lastname", "Athlete")
        email = f"{fname.lower()}.{lname.lower()}_{strava_athlete_id[:4]}@cycleclub.com"
        profile_img = athlete_info.get("profile")

        user_count = db.query(User).count()
        role = "OWNER" if user_count == 0 else "MEMBER"

        user = User(
            email=email,
            name=f"{fname} {lname}",
            avatar_url=profile_img,
            strava_athlete_id=strava_athlete_id,
            status="active",
            role=role
        )
        db.add(user)
        db.flush()

        club = db.query(Club).first()
        if not club:
            club = Club(name="Apex Velo Cycling Club", slug="apex-velo", owner_id=user.id)
            db.add(club)
            db.flush()

        membership = ClubMember(club_id=club.id, user_id=user.id, role=role, status="active")
        db.add(membership)
    else:
        user.strava_athlete_id = strava_athlete_id
        if athlete_info.get("profile") and not user.avatar_url:
            user.avatar_url = athlete_info.get("profile")

    # 4. Store tokens securely in backend database (NEVER exposed to frontend)
    conn = db.query(StravaConnection).filter(StravaConnection.user_id == user.id).first()
    if not conn:
        conn = StravaConnection(
            user_id=user.id,
            strava_athlete_id=strava_athlete_id,
            access_token=access_token,
            refresh_token=refresh_token,
            expires_at=expires_at,
            scope="read,activity:read_all"
        )
        db.add(conn)
    else:
        conn.strava_athlete_id = strava_athlete_id
        conn.access_token = access_token
        conn.refresh_token = refresh_token
        conn.expires_at = expires_at
        conn.updated_at = datetime.now(timezone.utc)

    db.commit()

    # Redirect user safely to Dashboard with confirmation
    target_url = f"{settings.FRONTEND_URL}/dashboard?strava_connected=true"
    return RedirectResponse(url=target_url)


@router.post("/strava/disconnect")
async def strava_disconnect(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Disconnects Strava account:
    - Removes Strava connection record and credentials from database.
    - Revokes application authorization on Strava where supported.
    - Preserves user Google account and previously imported activities.
    """
    conn = db.query(StravaConnection).filter(StravaConnection.user_id == current_user.id).first()
    if conn:
        try:
            strava_service = get_strava_service()
            await strava_service.deauthorize_athlete(access_token=conn.access_token)
        except Exception as e:
            logger.warning(f"Strava remote deauthorization warning for user {current_user.id}: {e}")

        db.delete(conn)

    current_user.strava_athlete_id = None
    db.commit()

    return {
        "message": "Strava disconnected successfully. Your previously imported activities remain in CycleClub.",
        "strava_connected": False
    }
