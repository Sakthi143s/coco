from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.analytics_service import AnalyticsService
from app.schemas.schemas import RiderAnalytics

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/rider/{rider_id}", response_model=RiderAnalytics)
def get_rider_analytics(rider_id: str, db: Session = Depends(get_db)):
    analytics = AnalyticsService.get_rider_analytics(db, rider_id=rider_id)
    if not analytics:
        raise HTTPException(status_code=404, detail="Rider analytics not found")
    return analytics
