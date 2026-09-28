import time
import logging
from typing import Optional
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.models.models import StravaConnection, User
from app.integrations.strava.service import get_strava_service

logger = logging.getLogger(__name__)

async def get_valid_access_token(user_id: str, db: Session) -> Optional[str]:
    """
    Retrieves a valid, non-expired Strava access token for a user.
    If the token is expired or expiring within 5 minutes (300s buffer),
    it automatically performs a refresh token exchange and updates the DB.
    
    SECURITY: Secrets and tokens are NEVER logged.
    """
    conn = db.query(StravaConnection).filter(StravaConnection.user_id == user_id).first()
    if not conn:
        logger.warning(f"No Strava connection found for user ID: {user_id}")
        return None

    now_ts = int(time.time())
    buffer_seconds = 300  # 5-minute safety buffer before expiry

    # Check if token is still valid
    if conn.expires_at > (now_ts + buffer_seconds):
        return conn.access_token

    # Token is expired or expiring soon, execute token refresh
    logger.info(f"Strava access token expired or expiring soon for user {user_id}. Refreshing token...")
    strava_service = get_strava_service()

    try:
        token_data = await strava_service.refresh_access_token(refresh_token=conn.refresh_token)
        
        new_access_token = token_data.get("access_token")
        new_refresh_token = token_data.get("refresh_token", conn.refresh_token)
        new_expires_at = token_data.get("expires_at", now_ts + token_data.get("expires_in", 21600))

        if not new_access_token:
            logger.error(f"Failed to obtain new access token during refresh for user {user_id}")
            return None

        # Persist refreshed credentials into DB
        conn.access_token = new_access_token
        conn.refresh_token = new_refresh_token
        conn.expires_at = new_expires_at
        conn.updated_at = datetime.now(timezone.utc)
        db.commit()

        logger.info(f"Successfully refreshed and persisted Strava access token for user {user_id}")
        return new_access_token

    except Exception as e:
        logger.error(f"Error during Strava token refresh for user {user_id}: {type(e).__name__}")
        db.rollback()
        return None
