from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta, timezone
from app.core.database import get_db
from app.models.models import User, Activity
from app.schemas.schemas import DashboardOverview
from app.services.leaderboard_engine import LeaderboardEngine, format_seconds

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # 1. Total Active Riders
    active_riders_count = db.query(func.count(User.id)).filter(User.status == "active").scalar() or 0

    # 2. Today's Rides Stats
    today_stats = db.query(
        func.count(Activity.id).label("ride_count"),
        func.coalesce(func.sum(Activity.distance), 0.0).label("total_dist"),
        func.coalesce(func.sum(Activity.elevation_gain), 0.0).label("total_elev"),
        func.coalesce(func.sum(Activity.moving_time), 0).label("total_time")
    ).filter(Activity.start_date >= today_start).first()

    # 3. Weekly Distance
    weekly_dist = db.query(func.coalesce(func.sum(Activity.distance), 0.0))\
        .filter(Activity.start_date >= week_start).scalar() or 0.0

    # 4. Monthly Distance
    monthly_dist = db.query(func.coalesce(func.sum(Activity.distance), 0.0))\
        .filter(Activity.start_date >= month_start).scalar() or 0.0

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
