from fastapi import APIRouter
from app.api.endpoints import (
    auth, dashboard, riders, activities, leaderboards, analytics, challenges, webhooks
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(dashboard.router)
api_router.include_router(riders.router)
api_router.include_router(activities.router)
api_router.include_router(leaderboards.router)
api_router.include_router(analytics.router)
api_router.include_router(challenges.router)
api_router.include_router(webhooks.router)
