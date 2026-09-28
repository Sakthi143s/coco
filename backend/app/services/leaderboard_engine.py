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

def get_club_timezone() -> ZoneInfo:
    tz_name = settings.CLUB_TIMEZONE or "Asia/Kolkata"
    try:
        return ZoneInfo(tz_name)
    except Exception as e:
        logger.warning(f"Invalid CLUB_TIMEZONE '{tz_name}', falling back to Asia/Kolkata: {e}")
        try:
            return ZoneInfo("Asia/Kolkata")
        except Exception:
            return timezone.utc

def get_timeframe_boundary(timeframe: str, club_tz: ZoneInfo) -> Optional[datetime]:
    """
    Computes timezone-aware start datetime boundary in club_tz for the given timeframe.
    Returns None for 'all_time' so no date filter is applied.
    Supported API values: today, week, month, year, all_time
    """
    tf = (timeframe or "today").lower().strip()
    now_club = datetime.now(club_tz)

    if tf == "today":
        return now_club.replace(hour=0, minute=0, second=0, microsecond=0)
    elif tf == "week":
        # Monday is start of the current week (ISO weekday Monday=0)
        return (now_club - timedelta(days=now_club.weekday())).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
    elif tf == "month":
        # 1st day of the current month
        return now_club.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    elif tf == "year":
        # 1st day of the current year (Jan 1)
        return now_club.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    elif tf == "all_time":
        return None
    else:
        # Default fallback for unrecognized timeframes is all_time (no date filter)
        return None

class LeaderboardEngine:
    @staticmethod
    def get_leaderboard(
        db: Session, timeframe: str = "today", category: str = "distance"
    ) -> LeaderboardResponse:
        # 1. Determine Club Local Timezone based on CLUB_TIMEZONE configuration
        club_tz = get_club_timezone()

        # Normalize timeframe key: today, week, month, year, all_time
        tf = (timeframe or "today").lower().strip()
        if tf not in ["today", "week", "month", "year", "all_time"]:
            tf = "all_time"

        # 2. Compute period start boundary in Club Timezone
        start_local = get_timeframe_boundary(tf, club_tz)

        # Build activity join conditions
        activity_conditions = [
            User.id == Activity.user_id,
            Activity.activity_type.in_(ALLOWED_ACTIVITY_TYPES)
        ]

        if start_local is not None:
            # Convert local start boundary to UTC for database comparison
            start_utc = start_local.astimezone(timezone.utc)
            start_utc_naive = start_utc.replace(tzinfo=None)
            activity_conditions.append(
                or_(
                    Activity.start_date >= start_utc,
                    Activity.start_date >= start_utc_naive
                )
            )
            log_boundary = f"start_local={start_local.isoformat()}, start_utc={start_utc.isoformat()}"
        else:
            # all_time applies NO date filter
            log_boundary = "no date filter (all_time)"

        logger.info(
            f"Computing leaderboard: timeframe={tf}, category={category}, "
            f"club_tz={club_tz}, {log_boundary}"
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
                and_(*activity_conditions)
            ).filter(
                User.status == "active",
                User.leaderboard_opt_in.isnot(False)
            ).group_by(
                User.id, User.name, User.avatar_url, User.strava_athlete_id
            )

            # 4. Sorting logic with tie-breaking
            # Prioritize riders with connected Strava accounts
            strava_connected_priority = desc(User.strava_athlete_id.isnot(None))

            cat = (category or "distance").lower().strip()
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

                # Weighted/calculated average speed strictly for rides in this timeframe
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

            logger.info(f"Leaderboard computed: {len(entries)} riders ranked for {tf}/{cat}")

            return LeaderboardResponse(
                timeframe=tf,
                category=cat,
                updated_at=datetime.now(timezone.utc),
                entries=entries
            )
        except Exception as e:
            logger.error(f"Error computing leaderboard for timeframe={tf}, category={cat}: {e}", exc_info=True)
            raise
