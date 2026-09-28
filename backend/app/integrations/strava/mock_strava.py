import time
import random
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta, timezone
from app.integrations.strava.base import BaseStravaService

class MockStravaService(BaseStravaService):
    def get_authorization_url(self, redirect_uri: str, state: Optional[str] = None) -> str:
        callback_target = f"{redirect_uri}?code=mock_strava_auth_code_12345"
        if state:
            callback_target += f"&state={state}"
        return callback_target

    async def exchange_token(self, code: str) -> Dict[str, Any]:
        strava_id = str(random.randint(1000000, 9999999))
        return {
            "token_type": "Bearer",
            "access_token": f"mock_access_token_{strava_id}_{int(time.time())}",
            "refresh_token": f"mock_refresh_token_{strava_id}_{int(time.time())}",
            "expires_at": int(time.time()) + 21600,
            "expires_in": 21600,
            "athlete": {
                "id": int(strava_id),
                "username": f"rider_{strava_id[:4]}",
                "firstname": "Alex",
                "lastname": "Rider",
                "city": "San Francisco",
                "state": "California",
                "country": "United States",
                "profile": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
                "created_at": "2024-01-15T08:00:00Z"
            }
        }

    async def refresh_access_token(self, refresh_token: str) -> Dict[str, Any]:
        return {
            "token_type": "Bearer",
            "access_token": f"refreshed_mock_access_token_{int(time.time())}",
            "refresh_token": refresh_token,
            "expires_at": int(time.time()) + 21600,
            "expires_in": 21600
        }

    async def get_athlete_profile(self, access_token: str) -> Dict[str, Any]:
        return {
            "id": 12345678,
            "username": "mock_athlete",
            "firstname": "Mock",
            "lastname": "Athlete",
            "city": "San Francisco",
            "profile": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
        }

    async def get_athlete_activities(
        self, access_token: str, after: Optional[int] = None, before: Optional[int] = None, page: int = 1, per_page: int = 30
    ) -> List[Dict[str, Any]]:
        activities = []
        now = datetime.now(timezone.utc)
        types = ["Ride", "Ride", "Ride", "EBikeRide", "VirtualRide"]
        names = [
            "Morning Alpine Climb", "Coastal Loop Tempo", "Sunday Endurance Mile",
            "Evening Recovery Spin", "Hill Repeat Hammer", "Group Peloton Sprint"
        ]

        count = min(per_page, 15)
        for i in range(count):
            date = now - timedelta(days=(page - 1) * 10 + i, hours=random.randint(1, 10))
            if after and int(date.timestamp()) < after:
                continue
            if before and int(date.timestamp()) > before:
                continue

            dist = round(random.uniform(25.0, 95.0), 2)
            moving_time = random.randint(3000, 10800)
            elev = round(dist * random.uniform(8.0, 22.0), 1)
            
            activities.append({
                "id": int(f"9000{page}{i}{random.randint(10, 99)}"),
                "name": random.choice(names),
                "distance": dist * 1000.0,  # Strava returns meters
                "moving_time": moving_time,
                "elapsed_time": moving_time + random.randint(300, 1200),
                "total_elevation_gain": elev,
                "type": random.choice(types),
                "start_date": date.isoformat(),
                "start_date_local": date.isoformat(),
                "average_speed": round((dist / (moving_time / 3600.0)) / 3.6, 2),  # m/s
                "max_speed": round(((dist / (moving_time / 3600.0)) * 1.4) / 3.6, 2),
                "kilojoules": round(dist * 25.4, 1),
                "start_latlng": [37.7749 + random.uniform(-0.1, 0.1), -122.4194 + random.uniform(-0.1, 0.1)]
            })

        return activities

    async def get_activity_by_id(self, access_token: str, activity_id: str) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        dist_km = round(random.uniform(40.0, 85.0), 2)
        moving_sec = random.randint(4500, 9000)
        
        return {
            "id": int(activity_id) if activity_id.isdigit() else random.randint(10000000, 99999999),
            "name": "Strava Sync Ride - " + str(activity_id),
            "distance": dist_km * 1000.0,
            "moving_time": moving_sec,
            "elapsed_time": moving_sec + random.randint(300, 900),
            "total_elevation_gain": round(dist_km * 15.0, 1),
            "type": "Ride",
            "start_date": now.isoformat(),
            "average_speed": round((dist_km / (moving_sec / 3600.0)) / 3.6, 2),
            "max_speed": round(((dist_km / (moving_sec / 3600.0)) * 1.35) / 3.6, 2),
            "kilojoules": round(dist_km * 28.0, 1),
            "start_latlng": [37.7749, -122.4194],
            "athlete": {"id": 12345678}
        }

    async def deauthorize_athlete(self, access_token: str) -> Dict[str, Any]:
        return {"access_token": access_token}
