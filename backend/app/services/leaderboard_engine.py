from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.core.config import settings
from app.models.models import User, Activity
from app.schemas.schemas import LeaderboardEntry, LeaderboardResponse

def format_seconds(seconds: int) -> str:
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    if hours > 0:
        return f"{hours}h {minutes}m"
    return f"{minutes}m"

class LeaderboardEngine:
    @staticmethod
    def get_leaderboard(
        db: Session, timeframe: str = "today", category: str = "distance"
    ) -> LeaderboardResponse:
        # Determine Club Local Time based on configured CLUB_TIMEZONE
        try:
            club_tz = ZoneInfo(settings.CLUB_TIMEZONE)
        except Exception:
            club_tz = timezone.utc

        now_club = datetime.now(club_tz)

        # Compute period start boundaries in Club Timezone
        if timeframe == "today":
            start_local = now_club.replace(hour=0, minute=0, second=0, microsecond=0)
        elif timeframe == "week":
            # Start of week (Monday) in club timezone
            start_local = (now_club - timedelta(days=now_club.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
        elif timeframe == "month":
            start_local = now_club.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        else:  # all_time
            start_local = datetime(2020, 1, 1, tzinfo=timezone.utc)

        # Convert local start boundary to UTC for database comparison
        start_date = start_local.astimezone(timezone.utc)

        # Base query joining User and Activity on real DB records
        query = db.query(
            User.id.label("rider_id"),
            User.name.label("rider_name"),
            User.avatar_url.label("rider_avatar"),
            User.strava_athlete_id.label("strava_athlete_id"),
            func.coalesce(func.sum(Activity.distance), 0.0).label("total_distance"),
            func.coalesce(func.sum(Activity.elevation_gain), 0.0).label("total_elevation"),
            func.coalesce(func.sum(Activity.moving_time), 0).label("total_moving_time"),
            func.coalesce(func.max(Activity.distance), 0.0).label("max_distance"),
            func.count(Activity.id).label("ride_count"),
            func.avg(Activity.average_speed).label("avg_speed")
        ).join(Activity, User.id == Activity.user_id)\
         .filter(User.status == "active")\
         .filter(User.leaderboard_opt_in == True)\
         .filter(Activity.start_date >= start_date)

        # Grouping by User
        query = query.group_by(User.id, User.name, User.avatar_url, User.strava_athlete_id)

        # Order by selected metric category
        if category == "distance":
            query = query.order_by(desc("total_distance"))
        elif category == "elevation":
            query = query.order_by(desc("total_elevation"))
        elif category == "longest_ride":
            query = query.order_by(desc("max_distance"))
        elif category == "most_active":
            query = query.order_by(desc("ride_count"), desc("total_distance"))
        else:
            query = query.order_by(desc("total_distance"))

        results = query.all()

        entries = []
        for idx, row in enumerate(results, start=1):
            dist_km = round(row.total_distance, 2)
            elev_m = round(row.total_elevation, 1)
            time_sec = int(row.total_moving_time)
            avg_speed_kmh = round(row.avg_speed or (dist_km / (time_sec / 3600.0) if time_sec > 0 else 0.0), 1)

            entries.append(
                LeaderboardEntry(
                    rank=idx,
                    rider_id=row.rider_id,
                    rider_name=row.rider_name,
                    rider_avatar=row.rider_avatar,
                    distance_km=dist_km,
                    elevation_m=elev_m,
                    moving_time_sec=time_sec,
                    moving_time_formatted=format_seconds(time_sec),
                    average_speed_kmh=avg_speed_kmh,
                    ride_count=row.ride_count,
                    max_single_distance_km=round(row.max_distance, 2),
                    strava_athlete_id=row.strava_athlete_id
                )
            )

        return LeaderboardResponse(
            timeframe=timeframe,
            category=category,
            updated_at=datetime.now(timezone.utc),
            entries=entries
        )
