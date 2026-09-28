from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from datetime import datetime, timezone
from app.core.database import get_db
from app.models.models import User, Activity
from app.schemas.schemas import DashboardOverview
from app.services.leaderboard_engine import (
    LeaderboardEngine,
    format_seconds,
    ALLOWED_ACTIVITY_TYPES,
    get_club_timezone,
    get_timeframe_boundary
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary")
def get_dashboard_summary(
    timeframe: str = Query("today", description="today, week, month, year, all_time"),
    db: Session = Depends(get_db)
):
    club_tz = get_club_timezone()

    today_start = get_timeframe_boundary("today", club_tz)
    week_start = get_timeframe_boundary("week", club_tz)
    month_start = get_timeframe_boundary("month", club_tz)

    today_utc = today_start.astimezone(timezone.utc)
    week_utc = week_start.astimezone(timezone.utc)
    month_utc = month_start.astimezone(timezone.utc)

    today_naive = today_utc.replace(tzinfo=None)
    week_naive = week_utc.replace(tzinfo=None)
    month_naive = month_utc.replace(tzinfo=None)

    # 1. Total Active Riders
    active_riders_count = db.query(func.count(User.id)).filter(User.status == "active").scalar() or 0

    # 2. Today's Rides Stats
    today_stats = db.query(
        func.count(Activity.id).label("ride_count"),
        func.coalesce(func.sum(Activity.distance), 0.0).label("total_dist"),
        func.coalesce(func.sum(Activity.elevation_gain), 0.0).label("total_elev"),
        func.coalesce(func.sum(Activity.moving_time), 0).label("total_time")
    ).filter(
        or_(Activity.start_date >= today_utc, Activity.start_date >= today_naive),
        Activity.activity_type.in_(ALLOWED_ACTIVITY_TYPES)
    ).first()

    # 3. Weekly Distance
    weekly_dist = db.query(func.coalesce(func.sum(Activity.distance), 0.0))\
        .filter(
            or_(Activity.start_date >= week_utc, Activity.start_date >= week_naive),
            Activity.activity_type.in_(ALLOWED_ACTIVITY_TYPES)
        ).scalar() or 0.0

    # 4. Monthly Distance
    monthly_dist = db.query(func.coalesce(func.sum(Activity.distance), 0.0))\
        .filter(
            or_(Activity.start_date >= month_utc, Activity.start_date >= month_naive),
            Activity.activity_type.in_(ALLOWED_ACTIVITY_TYPES)
        ).scalar() or 0.0

    # 5. Leaderboard for the requested timeframe (today, week, month, year, all_time)
    leaderboard_data = LeaderboardEngine.get_leaderboard(db, timeframe=timeframe, category="distance")

    return {
        "overview": DashboardOverview(
            total_active_riders=active_riders_count,
            rides_today=today_stats.ride_count if today_stats else 0,
            distance_today_km=round(today_stats.total_dist, 1) if today_stats else 0.0,
            elevation_today_m=round(today_stats.total_elev, 0) if today_stats else 0.0,
            moving_time_today_sec=today_stats.total_time if today_stats else 0,
            moving_time_today_formatted=format_seconds(today_stats.total_time if today_stats else 0),
            weekly_distance_km=round(weekly_dist, 1),
            monthly_distance_km=round(monthly_dist, 1)
        ),
        "leaderboard_today": leaderboard_data
    }
