from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field

# --- User / Auth Schemas ---
class CurrentUserResponse(BaseModel):
    id: str
    supabase_user_id: Optional[str] = None
    email: str
    name: str
    avatar_url: Optional[str] = None
    role: str = "MEMBER"  # OWNER, MEMBER
    status: str = "active"
    leaderboard_opt_in: bool = True
    strava_athlete_id: Optional[str] = None
    strava_connected: bool = False
    club_id: Optional[str] = None
    club_name: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RiderBase(BaseModel):
    email: str
    name: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    profile_image: Optional[str] = None
    role: str = "MEMBER"
    status: str = "active"
    leaderboard_opt_in: bool = True

class RiderCreate(RiderBase):
    pass

class RiderUpdate(BaseModel):
    name: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    profile_image: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None
    leaderboard_opt_in: Optional[bool] = None

class RiderResponse(BaseModel):
    id: str
    email: str
    name: str
    full_name: str
    avatar_url: Optional[str] = None
    profile_image: Optional[str] = None
    role: str = "MEMBER"
    status: str = "active"
    leaderboard_opt_in: bool = True
    strava_athlete_id: Optional[str] = None
    strava_connection_status: str = "disconnected"
    joined_date: datetime
    total_rides: int = 0
    total_distance_km: float = 0.0
    total_elevation_m: float = 0.0
    total_moving_time_hrs: float = 0.0

    model_config = ConfigDict(from_attributes=True)


# --- Activity Schemas ---
class ActivityBase(BaseModel):
    strava_activity_id: str
    activity_type: str = "Ride"
    name: Optional[str] = None
    activity_name: Optional[str] = None
    distance: float  # km
    moving_time: int  # seconds
    elapsed_time: int  # seconds
    elevation_gain: float  # meters
    average_speed: float  # km/h
    max_speed: Optional[float] = 0.0
    calories: Optional[int] = 0
    start_date: datetime
    start_latitude: Optional[float] = None
    start_longitude: Optional[float] = None
    strava_url: Optional[str] = None

class ActivityCreate(ActivityBase):
    user_id: Optional[str] = None
    rider_id: Optional[str] = None
    club_id: Optional[str] = None

class ActivityResponse(BaseModel):
    id: str
    strava_activity_id: str
    user_id: str
    rider_id: str
    rider_name: Optional[str] = "Unknown Rider"
    rider_avatar: Optional[str] = None
    activity_type: str
    name: str
    activity_name: str
    distance: float
    moving_time: int
    elapsed_time: int
    elevation_gain: float
    average_speed: float
    max_speed: Optional[float] = 0.0
    calories: Optional[int] = 0
    start_date: datetime
    start_latitude: Optional[float] = None
    start_longitude: Optional[float] = None
    strava_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Dashboard Overview Schemas ---
class DashboardOverview(BaseModel):
    total_active_riders: int
    rides_today: int
    distance_today_km: float
    elevation_today_m: float
    moving_time_today_sec: int
    moving_time_today_formatted: str
    weekly_distance_km: float
    monthly_distance_km: float


# --- Leaderboard Schemas ---
class LeaderboardEntry(BaseModel):
    rank: int
    rider_id: str
    rider_name: str
    rider_avatar: Optional[str] = None
    distance_km: float
    elevation_m: float
    moving_time_sec: int
    moving_time_formatted: str
    average_speed_kmh: float
    ride_count: int = 1
    max_single_distance_km: Optional[float] = 0.0
    strava_athlete_id: Optional[str] = None

class LeaderboardResponse(BaseModel):
    timeframe: str  # today, week, month, all_time
    category: str   # distance, elevation, longest_ride, activity_count
    updated_at: datetime
    entries: List[LeaderboardEntry]


# --- Rider Analytics Detail Schema ---
class RiderAnalytics(BaseModel):
    rider: RiderResponse
    total_rides: int
    total_distance_km: float
    total_elevation_m: float
    total_moving_time_sec: int
    total_moving_time_formatted: str
    average_speed_kmh: float
    longest_ride_km: float
    avg_distance_per_ride_km: float
    
    # Trends and Charts Data
    distance_over_time: List[dict]
    weekly_distance: List[dict]
    monthly_distance: List[dict]
    elevation_trend: List[dict]
    ride_frequency: List[dict]

    recent_activities: List[ActivityResponse]


# --- Challenge Schemas ---
class ChallengeResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    challenge_type: str
    target_metric: str
    target_value: float
    start_date: datetime
    end_date: datetime
    status: str
    participant_count: int = 0
    top_participants: List[dict] = []

    model_config = ConfigDict(from_attributes=True)


# --- Strava OAuth & Webhook Schemas ---
class StravaAuthResponse(BaseModel):
    authorize_url: str
    is_mock: bool
    mode: str

class StravaWebhookEvent(BaseModel):
    object_type: str  # "activity" or "athlete"
    object_id: int
    aspect_type: str  # "create", "update", "delete"
    owner_id: int
    subscription_id: int
    event_time: int
    updates: Optional[dict] = None
