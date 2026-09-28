from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.leaderboard_engine import LeaderboardEngine
from app.schemas.schemas import LeaderboardResponse

router = APIRouter(prefix="/leaderboards", tags=["Leaderboards"])

@router.get("", response_model=LeaderboardResponse)
def get_leaderboard(
    timeframe: str = Query("today", description="today, week, month, year, all_time"),
    category: str = Query("distance", description="distance, elevation, longest_ride, most_active"),
    db: Session = Depends(get_db)
):
    return LeaderboardEngine.get_leaderboard(db, timeframe=timeframe, category=category)
