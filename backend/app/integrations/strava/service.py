from app.core.config import settings
from app.integrations.strava.base import BaseStravaService
from app.integrations.strava.mock_strava import MockStravaService
from app.integrations.strava.real_strava import RealStravaService

def get_strava_service() -> BaseStravaService:
    """
    Returns Mock or Real Strava Service based on application configuration (STRAVA_MODE).
    """
    if settings.is_mock_strava:
        return MockStravaService()
    return RealStravaService()
