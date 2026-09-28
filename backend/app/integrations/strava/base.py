from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional

class BaseStravaService(ABC):
    @abstractmethod
    def get_authorization_url(self, redirect_uri: str, state: Optional[str] = None) -> str:
        """Generates Strava OAuth authorization URL."""
        pass

    @abstractmethod
    async def exchange_token(self, code: str) -> Dict[str, Any]:
        """Exchanges OAuth code for access & refresh tokens and athlete profile."""
        pass

    @abstractmethod
    async def refresh_access_token(self, refresh_token: str) -> Dict[str, Any]:
        """Refreshes an expired access token using the refresh token."""
        pass

    @abstractmethod
    async def get_athlete_profile(self, access_token: str) -> Dict[str, Any]:
        """Retrieves authenticated athlete profile."""
        pass

    @abstractmethod
    async def get_athlete_activities(
        self, access_token: str, after: Optional[int] = None, before: Optional[int] = None, page: int = 1, per_page: int = 30
    ) -> List[Dict[str, Any]]:
        """Retrieves paginated activities for an athlete."""
        pass

    @abstractmethod
    async def get_activity_by_id(self, access_token: str, activity_id: str) -> Dict[str, Any]:
        """Fetches detailed activity record from Strava."""
        pass

    @abstractmethod
    async def deauthorize_athlete(self, access_token: str) -> Dict[str, Any]:
        """Deauthorizes application access for the athlete on Strava."""
        pass
