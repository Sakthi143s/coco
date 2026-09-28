from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.models.models import User, Activity, StravaConnection
from app.schemas.schemas import RiderAnalytics, RiderResponse, ActivityResponse
from app.services.leaderboard_engine import format_seconds

class AnalyticsService:
    @staticmethod
    def get_rider_analytics(db: Session, rider_id: str) -> Optional[RiderAnalytics]:
        user = db.query(User).filter(User.id == rider_id).first()
        if not user:
            return None

        # Fetch activities for user strictly from real DB records
        activities = (
            db.query(Activity)
            .filter(Activity.user_id == rider_id)
            .order_by(desc(Activity.start_date))
            .all()
        )

        total_rides = len(activities)
        total_distance = sum(a.distance for a in activities)
        total_elevation = sum(a.elevation_gain for a in activities)
        total_moving_sec = sum(a.moving_time for a in activities)
        longest_ride = max((a.distance for a in activities), default=0.0)
        avg_distance = round(total_distance / total_rides, 2) if total_rides > 0 else 0.0
        avg_speed = (
            round(sum(a.average_speed for a in activities) / total_rides, 1)
            if total_rides > 0
            else 0.0
        )

        # Connection status
        strava_conn = db.query(StravaConnection).filter(StravaConnection.user_id == user.id).first()
        conn_status = "connected" if strava_conn else "disconnected"

        rider_schema = RiderResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            full_name=user.name,
            avatar_url=user.avatar_url,
            profile_image=user.avatar_url,
            role=user.role,
            status=user.status,
            strava_athlete_id=user.strava_athlete_id,
            strava_connection_status=conn_status,
            joined_date=user.created_at,
            total_rides=total_rides,
            total_distance_km=round(total_distance, 2),
            total_elevation_m=round(total_elevation, 1),
            total_moving_time_hrs=round(total_moving_sec / 3600.0, 1)
        )

        # --- Distance Over Time & Elevation Trend ---
        daily_map: Dict[str, Dict[str, float]] = {}
        for a in reversed(activities):
            d_str = a.start_date.strftime("%Y-%m-%d")
            if d_str not in daily_map:
                daily_map[d_str] = {"distance": 0.0, "elevation": 0.0, "rides": 0}
            daily_map[d_str]["distance"] += a.distance
            daily_map[d_str]["elevation"] += a.elevation_gain
            daily_map[d_str]["rides"] += 1

        distance_over_time = [
            {"date": d, "distance": round(vals["distance"], 1), "elevation": round(vals["elevation"], 0)}
            for d, vals in sorted(daily_map.items())
        ]

        elevation_trend = [
            {"date": d, "elevation": round(vals["elevation"], 0)}
            for d, vals in sorted(daily_map.items())
        ]

        # --- Weekly Distance ---
        weekly_map: Dict[str, float] = {}
        for a in reversed(activities):
            w_str = f"W{a.start_date.isocalendar()[1]}"
            weekly_map[w_str] = weekly_map.get(w_str, 0.0) + a.distance

        weekly_distance = [
            {"week": w, "distance": round(dist, 1)} for w, dist in weekly_map.items()
        ]

        # --- Monthly Distance ---
        monthly_map: Dict[str, float] = {}
        for a in reversed(activities):
            m_str = a.start_date.strftime("%b %Y")
            monthly_map[m_str] = monthly_map.get(m_str, 0.0) + a.distance

        monthly_distance = [
            {"month": m, "distance": round(dist, 1)} for m, dist in monthly_map.items()
        ]

        # --- Ride Frequency by Day of Week ---
        days_order = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        freq_map = {d: 0 for d in days_order}
        for a in activities:
            day_name = a.start_date.strftime("%a")
            if day_name in freq_map:
                freq_map[day_name] += 1

        ride_frequency = [{"day": d, "count": freq_map[d]} for d in days_order]

        # Recent Activity Responses
        recent_activities_responses = [
            ActivityResponse(
                id=a.id,
                strava_activity_id=a.strava_activity_id,
                user_id=a.user_id,
                rider_id=a.user_id,
                rider_name=user.name,
                rider_avatar=user.avatar_url,
                activity_type=a.activity_type,
                name=a.name,
                activity_name=a.name,
                distance=round(a.distance, 2),
                moving_time=a.moving_time,
                elapsed_time=a.elapsed_time,
                elevation_gain=round(a.elevation_gain, 1),
                average_speed=round(a.average_speed, 1),
                max_speed=round(a.max_speed, 1) if a.max_speed else 0.0,
                calories=a.calories or 0,
                start_date=a.start_date,
                start_latitude=a.start_latitude,
                start_longitude=a.start_longitude,
                strava_url=a.strava_url,
                created_at=a.created_at,
                updated_at=a.updated_at
            )
            for a in activities[:20]
        ]

        return RiderAnalytics(
            rider=rider_schema,
            total_rides=total_rides,
            total_distance_km=round(total_distance, 2),
            total_elevation_m=round(total_elevation, 1),
            total_moving_time_sec=total_moving_sec,
            total_moving_time_formatted=format_seconds(total_moving_sec),
            average_speed_kmh=avg_speed,
            longest_ride_km=round(longest_ride, 2),
            avg_distance_per_ride_km=avg_distance,
            distance_over_time=distance_over_time,
            weekly_distance=weekly_distance,
            monthly_distance=monthly_distance,
            elevation_trend=elevation_trend,
            ride_frequency=ride_frequency,
            recent_activities=recent_activities_responses
        )
