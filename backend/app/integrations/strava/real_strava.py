import httpx
from typing import Dict, Any, List, Optional
import logging
from app.integrations.strava.base import BaseStravaService
from app.core.config import settings

logger = logging.getLogger(__name__)

STRAVA_AUTH_URL = "https://www.strava.com/oauth/authorize"
STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token"
STRAVA_DEAUTH_URL = "https://www.strava.com/oauth/deauthorize"
STRAVA_API_BASE = "https://www.strava.com/api/v3"

class RealStravaService(BaseStravaService):
    def get_authorization_url(self, redirect_uri: str, state: Optional[str] = None) -> str:
        params = (
            f"?client_id={settings.STRAVA_CLIENT_ID}"
            f"&response_type=code"
            f"&redirect_uri={redirect_uri}"
            f"&approval_prompt=auto"
            f"&scope=read,activity:read_all,profile:read_all"
        )
        if state:
            params += f"&state={state}"
        return STRAVA_AUTH_URL + params

    async def exchange_token(self, code: str) -> Dict[str, Any]:
        payload = {
            "client_id": settings.STRAVA_CLIENT_ID,
            "client_secret": settings.STRAVA_CLIENT_SECRET,
            "code": code,
            "grant_type": "authorization_code"
        }
        async with httpx.AsyncClient() as client:
            resp = await client.post(STRAVA_TOKEN_URL, data=payload)
            if resp.status_code != 200:
                logger.error(f"Strava token exchange failed with status {resp.status_code}")
                resp.raise_for_status()
            return resp.json()

    async def refresh_access_token(self, refresh_token: str) -> Dict[str, Any]:
        payload = {
            "client_id": settings.STRAVA_CLIENT_ID,
            "client_secret": settings.STRAVA_CLIENT_SECRET,
            "grant_type": "refresh_token",
            "refresh_token": refresh_token
        }
        async with httpx.AsyncClient() as client:
            resp = await client.post(STRAVA_TOKEN_URL, data=payload)
            if resp.status_code != 200:
                logger.error(f"Strava token refresh failed with status {resp.status_code}")
                resp.raise_for_status()
            return resp.json()

    async def get_athlete_profile(self, access_token: str) -> Dict[str, Any]:
        headers = {"Authorization": f"Bearer {access_token}"}
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{STRAVA_API_BASE}/athlete", headers=headers)
            resp.raise_for_status()
            return resp.json()

    async def get_athlete_activities(
        self, access_token: str, after: Optional[int] = None, before: Optional[int] = None, page: int = 1, per_page: int = 30
    ) -> List[Dict[str, Any]]:
        headers = {"Authorization": f"Bearer {access_token}"}
        params = {"page": page, "per_page": min(per_page, 200)}
        if after:
            params["after"] = after
        if before:
            params["before"] = before

        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{STRAVA_API_BASE}/athlete/activities", headers=headers, params=params)
            resp.raise_for_status()
            return resp.json()

    async def get_activity_by_id(self, access_token: str, activity_id: str) -> Dict[str, Any]:
        headers = {"Authorization": f"Bearer {access_token}"}
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{STRAVA_API_BASE}/activities/{activity_id}", headers=headers)
            resp.raise_for_status()
            return resp.json()

    async def deauthorize_athlete(self, access_token: str) -> Dict[str, Any]:
        headers = {"Authorization": f"Bearer {access_token}"}
        async with httpx.AsyncClient() as client:
            resp = await client.post(STRAVA_DEAUTH_URL, headers=headers)
            resp.raise_for_status()
            return resp.json()
