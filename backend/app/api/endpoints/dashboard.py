from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from app.core.config import settings
from app.core.database import get_db
from app.models.models import User, Activity
from app.schemas.schemas import DashboardOverview
from app.services.leaderboard_engine import LeaderboardEngine, format_seconds, ALLOWED_ACTIVITY_TYPES

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    tz_name = settings.CLUB_TIMEZONE or "Asia/Kolkata"
    try:
        club_tz = ZoneInfo(tz_name)
    except Exception:
        try:
            club_tz = ZoneInfo("Asia/Kolkata")
        except Exception:
            club_tz = timezone.utc

    now_club = datetime.now(club_tz)
    today_start = now_club.replace(hour=0, minute=0, second=0, microsecond=0).astimezone(timezone.utc)
    week_start = (now_club - timedelta(days=now_club.weekday())).replace(hour=0, minute=0, second=0, microsecond=0).astimezone(timezone.utc)
    month_start = now_club.replace(day=1, hour=0, minute=0, second=0, microsecond=0).astimezone(timezone.utc)

    today_naive = today_start.replace(tzinfo=None)
    week_naive = week_start.replace(tzinfo=None)
    month_naive = month_start.replace(tzinfo=None)

    # 1. Total Active Riders
    active_riders_count = db.query(func.count(User.id)).filter(User.status == "active").scalar() or 0

    # 2. Today's Rides Stats
    today_stats = db.query(
        func.count(Activity.id).label("ride_count"),
        func.coalesce(func.sum(Activity.distance), 0.0).label("total_dist"),
        func.coalesce(func.sum(Activity.elevation_gain), 0.0).label("total_elev"),
        func.coalesce(func.sum(Activity.moving_time), 0).label("total_time")
    ).filter(
        or_(Activity.start_date >= today_start, Activity.start_date >= today_naive),
        Activity.activity_type.in_(ALLOWED_ACTIVITY_TYPES)
    ).first()

    # 3. Weekly Distance
    weekly_dist = db.query(func.coalesce(func.sum(Activity.distance), 0.0))\
        .filter(
            or_(Activity.start_date >= week_start, Activity.start_date >= week_naive),
            Activity.activity_type.in_(ALLOWED_ACTIVITY_TYPES)
        ).scalar() or 0.0

    # 4. Monthly Distance
    monthly_dist = db.query(func.coalesce(func.sum(Activity.distance), 0.0))\
        .filter(
            or_(Activity.start_date >= month_start, Activity.start_date >= month_naive),
            Activity.activity_type.in_(ALLOWED_ACTIVITY_TYPES)
        ).scalar() or 0.0

    # 5. Today's Leaderboard
    leaderboard_today = LeaderboardEngine.get_leaderboard(db, timeframe="today", category="distance")

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
        "leaderboard_today": leaderboard_today
    }
