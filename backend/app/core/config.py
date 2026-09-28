import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "CycleClub Analytics"
    ENV: str = "development"
    SECRET_KEY: str = "super-secret-key-change-in-production-32-chars!"
    PORT: int = 8000
    FRONTEND_URL: str = "https://coco-begb.vercel.app"
    CLUB_TIMEZONE: str = "Asia/Kolkata"  # Timezone for daily/weekly/monthly leaderboard calculation

    # Database
    DATABASE_URL: str = "sqlite:///./cycleclub.db"

    # Supabase Auth Configuration
    SUPABASE_URL: str = "https://oncdnapacnzayvqxyubf.supabase.co"
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""

    # Strava API Configuration
    STRAVA_MODE: str = "real"  # Default production mode: "real"
    STRAVA_CLIENT_ID: str = "283006"
    STRAVA_CLIENT_SECRET: str = ""
    STRAVA_VERIFY_TOKEN: str = "cycle_club_webhook_verify_token_123"
    STRAVA_REDIRECT_URI: str = "https://coco-lz7z.onrender.com/api/auth/strava/callback"
    USE_MOCK_STRAVA: bool = False  # Backward compatibility fallback

    @property
    def is_mock_strava(self) -> bool:
        mode = self.STRAVA_MODE.lower().strip()
        if mode in ["mock", "test", "demo"]:
            return True
        if mode in ["real", "prod", "production"]:
            return False
        return self.USE_MOCK_STRAVA

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
