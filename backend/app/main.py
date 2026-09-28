from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.api.router import api_router
from app.models.models import Club

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database schema is initialized without seeding fake users or activities
    Base.metadata.create_all(bind=engine)
    
    # Initialize default club if not yet present
    db = SessionLocal()
    try:
        club = db.query(Club).first()
        if not club:
            club = Club(
                name="Apex Velo Cycling Club",
                slug="apex-velo",
                description="Premier competitive & endurance cycling community."
            )
            db.add(club)
            db.commit()
    except Exception as e:
        print(f"Error checking default club: {e}")
    finally:
        db.close()
        
    yield

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Production-Ready Cycling Club Management & Strava Performance Dashboard API",
    lifespan=lifespan
)

# CORS Configuration
origins = [
    "https://coco-begb.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
if settings.FRONTEND_URL and settings.FRONTEND_URL not in origins:
    origins.append(settings.FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes
app.include_router(api_router, prefix="/api")

@app.get("/")
def root():
    return {
        "name": settings.APP_NAME,
        "status": "online",
        "strava_mode": settings.STRAVA_MODE,
        "is_mock_strava": settings.is_mock_strava,
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=settings.PORT, reload=True)
