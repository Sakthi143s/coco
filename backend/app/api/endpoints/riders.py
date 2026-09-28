from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.core.database import get_db
from app.core.auth import get_current_user, require_owner, get_current_user_optional
from app.models.models import User, Activity, StravaConnection
from app.schemas.schemas import RiderResponse, RiderCreate, RiderUpdate

router = APIRouter(prefix="/riders", tags=["Riders"])

@router.get("", response_model=List[RiderResponse])
def list_riders(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(User)
    if status_filter and status_filter != "all":
        query = query.filter(User.status == status_filter)
    
    users = query.order_by(User.name).all()
    results = []

    for user in users:
        # Calculate stats strictly from real DB records
        stats = db.query(
            func.count(Activity.id).label("ride_count"),
            func.coalesce(func.sum(Activity.distance), 0.0).label("dist"),
            func.coalesce(func.sum(Activity.elevation_gain), 0.0).label("elev"),
            func.coalesce(func.sum(Activity.moving_time), 0).label("time_sec")
        ).filter(Activity.user_id == user.id).first()

        strava_conn = db.query(StravaConnection).filter(StravaConnection.user_id == user.id).first()
        conn_status = "connected" if strava_conn else "disconnected"

        results.append(
            RiderResponse(
                id=user.id,
                email=user.email,
                name=user.name,
                full_name=user.name,
                avatar_url=user.avatar_url,
                profile_image=user.avatar_url,
                role=user.role,
                status=user.status,
                leaderboard_opt_in=user.leaderboard_opt_in,
                strava_athlete_id=user.strava_athlete_id,
                strava_connection_status=conn_status,
                joined_date=user.created_at,
                total_rides=stats.ride_count if stats else 0,
                total_distance_km=round(stats.dist, 1) if stats else 0.0,
                total_elevation_m=round(stats.elev, 0) if stats else 0.0,
                total_moving_time_hrs=round((stats.time_sec if stats else 0) / 3600.0, 1)
            )
        )

    return results

@router.post("", response_model=RiderResponse, status_code=status.HTTP_201_CREATED)
def create_rider(
    rider_in: RiderCreate,
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    existing = db.query(User).filter(User.email == rider_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    name = rider_in.name or rider_in.full_name or rider_in.email.split("@")[0].capitalize()
    avatar = rider_in.avatar_url or rider_in.profile_image

    new_user = User(
        email=rider_in.email,
        name=name,
        avatar_url=avatar,
        role=rider_in.role or "MEMBER",
        status=rider_in.status or "active",
        leaderboard_opt_in=rider_in.leaderboard_opt_in
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return RiderResponse(
        id=new_user.id,
        email=new_user.email,
        name=new_user.name,
        full_name=new_user.name,
        avatar_url=new_user.avatar_url,
        profile_image=new_user.avatar_url,
        role=new_user.role,
        status=new_user.status,
        leaderboard_opt_in=new_user.leaderboard_opt_in,
        strava_athlete_id=None,
        strava_connection_status="disconnected",
        joined_date=new_user.created_at,
        total_rides=0,
        total_distance_km=0.0,
        total_elevation_m=0.0,
        total_moving_time_hrs=0.0
    )

@router.get("/{rider_id}", response_model=RiderResponse)
def get_rider(rider_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == rider_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Rider not found")

    stats = db.query(
        func.count(Activity.id).label("ride_count"),
        func.coalesce(func.sum(Activity.distance), 0.0).label("dist"),
        func.coalesce(func.sum(Activity.elevation_gain), 0.0).label("elev"),
        func.coalesce(func.sum(Activity.moving_time), 0).label("time_sec")
    ).filter(Activity.user_id == user.id).first()

    strava_conn = db.query(StravaConnection).filter(StravaConnection.user_id == user.id).first()
    conn_status = "connected" if strava_conn else "disconnected"

    return RiderResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        full_name=user.name,
        avatar_url=user.avatar_url,
        profile_image=user.avatar_url,
        role=user.role,
        status=user.status,
        leaderboard_opt_in=user.leaderboard_opt_in,
        strava_athlete_id=user.strava_athlete_id,
        strava_connection_status=conn_status,
        joined_date=user.created_at,
        total_rides=stats.ride_count if stats else 0,
        total_distance_km=round(stats.dist, 1) if stats else 0.0,
        total_elevation_m=round(stats.elev, 0) if stats else 0.0,
        total_moving_time_hrs=round((stats.time_sec if stats else 0) / 3600.0, 1)
    )

@router.patch("/{rider_id}", response_model=RiderResponse)
def update_rider(
    rider_id: str,
    rider_in: RiderUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == rider_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Rider not found")

    # Only OWNER or the rider themselves can edit
    if current_user.role != "OWNER" and current_user.id != rider_id:
        raise HTTPException(status_code=403, detail="Forbidden: You do not have permission to modify this rider profile.")

    name = rider_in.name or rider_in.full_name
    if name is not None:
        user.name = name

    avatar = rider_in.avatar_url or rider_in.profile_image
    if avatar is not None:
        user.avatar_url = avatar

    if rider_in.role is not None and current_user.role == "OWNER":
        user.role = rider_in.role

    if rider_in.status is not None and current_user.role == "OWNER":
        user.status = rider_in.status

    if rider_in.leaderboard_opt_in is not None:
        user.leaderboard_opt_in = rider_in.leaderboard_opt_in

    db.commit()
    db.refresh(user)

    return get_rider(rider_id, db)

@router.delete("/{rider_id}")
def delete_rider(
    rider_id: str,
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    """
    Remove a rider from the club. Owner-only permission.
    """
    user = db.query(User).filter(User.id == rider_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Rider not found")

    db.delete(user)
    db.commit()
    return {"message": "Rider removed successfully", "rider_id": rider_id}
