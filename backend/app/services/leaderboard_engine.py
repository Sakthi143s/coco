import logging
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_, and_
from app.core.config import settings
from app.models.models import User, Activity
from app.schemas.schemas import LeaderboardEntry, LeaderboardResponse

logger = logging.getLogger(__name__)

# Permitted cycling activity types according to application rules
ALLOWED_ACTIVITY_TYPES = [
    "Ride",
    "EBikeRide",
    "VirtualRide",
    "ride",
    "ebikeride",
    "virtualride",
    "Handcycle",
    "Velomobile"
]

def format_seconds(seconds: int) -> str:
    if not seconds or seconds <= 0:
        return "0m"
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
        # 1. Determine Club Local Timezone based on CLUB_TIMEZONE configuration
        tz_name = settings.CLUB_TIMEZONE or "Asia/Kolkata"
        try:
            club_tz = ZoneInfo(tz_name)
        except Exception as e:
            logger.warning(f"Invalid CLUB_TIMEZONE '{tz_name}', falling back to Asia/Kolkata: {e}")
            try:
                club_tz = ZoneInfo("Asia/Kolkata")
            except Exception:
                club_tz = timezone.utc

        now_club = datetime.now(club_tz)

        # 2. Compute period start boundary in Club Timezone
        tf = timeframe.lower().strip()
        if tf == "today":
            start_local = now_club.replace(hour=0, minute=0, second=0, microsecond=0)
        elif tf == "week":
            # Monday is start of the current week (ISO weekday Monday=0)
            start_local = (now_club - timedelta(days=now_club.weekday())).replace(
                hour=0, minute=0, second=0, microsecond=0
            )
        elif tf == "month":
            # 1st day of the current month
            start_local = now_club.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        else:  # all_time or unrecognized
            tf = "all_time"
            start_local = datetime(2020, 1, 1, 0, 0, 0, tzinfo=club_tz)

        # Convert local start boundary to UTC for database comparison
        start_utc = start_local.astimezone(timezone.utc)
        start_utc_naive = start_utc.replace(tzinfo=None)

        logger.info(
            f"Computing leaderboard: timeframe={tf}, category={category}, "
            f"club_tz={club_tz}, start_local={start_local.isoformat()}, start_utc={start_utc.isoformat()}"
        )

        try:
            # 3. Outer Join Query:
            # Keeps all active club riders in rankings even if they haven't ridden yet in the current timeframe
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
                func.coalesce(func.avg(Activity.average_speed), 0.0).label("avg_speed")
            ).outerjoin(
                Activity,
                and_(
                    User.id == Activity.user_id,
                    or_(
                        Activity.start_date >= start_utc,
                        Activity.start_date >= start_utc_naive
                    ),
                    Activity.activity_type.in_(ALLOWED_ACTIVITY_TYPES)
                )
            ).filter(
                User.status == "active",
                User.leaderboard_opt_in.isnot(False)
            ).group_by(
                User.id, User.name, User.avatar_url, User.strava_athlete_id
            )

            # 4. Sorting logic with tie-breaking
            # Prioritize riders with connected Strava and active rides
            strava_connected_priority = desc(User.strava_athlete_id.isnot(None))

            cat = category.lower().strip()
            if cat == "distance":
                query = query.order_by(
                    desc("total_distance"),
                    desc("total_elevation"),
                    strava_connected_priority,
                    User.name.asc()
                )
            elif cat == "elevation":
                query = query.order_by(
                    desc("total_elevation"),
                    desc("total_distance"),
                    strava_connected_priority,
                    User.name.asc()
                )
            elif cat == "longest_ride":
                query = query.order_by(
                    desc("max_distance"),
                    desc("total_distance"),
                    strava_connected_priority,
                    User.name.asc()
                )
            elif cat == "most_active":
                query = query.order_by(
                    desc("ride_count"),
                    desc("total_distance"),
                    strava_connected_priority,
                    User.name.asc()
                )
            else:
                cat = "distance"
                query = query.order_by(
                    desc("total_distance"),
                    desc("total_elevation"),
                    strava_connected_priority,
                    User.name.asc()
                )

            results = query.all()

            entries = []
            for idx, row in enumerate(results, start=1):
                dist_km = round(float(row.total_distance or 0.0), 2)
                elev_m = round(float(row.total_elevation or 0.0), 1)
                time_sec = int(row.total_moving_time or 0)
                ride_count = int(row.ride_count or 0)

                # Calculate speed only if rides were logged in timeframe
                if ride_count > 0 and time_sec > 0:
                    avg_speed_kmh = round(float(row.avg_speed or (dist_km / (time_sec / 3600.0))), 1)
                else:
                    avg_speed_kmh = 0.0

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
                        ride_count=ride_count,
                        max_single_distance_km=round(float(row.max_distance or 0.0), 2),
                        strava_athlete_id=row.strava_athlete_id
                    )
                )

            logger.info(f"Leaderboard computed successfully: {len(entries)} riders ranked for {tf}/{cat}")

            return LeaderboardResponse(
                timeframe=tf,
                category=cat,
                updated_at=datetime.now(timezone.utc),
                entries=entries
            )
        except Exception as e:
            logger.error(f"Error computing leaderboard for timeframe={tf}, category={cat}: {e}", exc_info=True)
            raise
