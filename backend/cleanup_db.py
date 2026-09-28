import sys
import os

# Add parent directory to sys.path if needed
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine, Base
from app.models.models import User, Activity, StravaConnection, ClubMember, Challenge, ChallengeParticipant, Club

def cleanup_database():
    """
    One-time cleanup operation to remove all mock and seeded demo data from the database
    and migrate tables to the production schema.
    Does NOT run automatically on server startup.
    Can be run via:
        python cleanup_db.py
        or
        python -m app.cleanup_db
    """
    print("[CLEANUP] Starting CycleClub Analytics database cleanup & schema reset...")
    # Drop all tables to ensure clean slate with updated schema
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Initialize clean default club with no mock owner
        club = Club(
            name="Apex Velo Cycling Club",
            slug="apex-velo",
            description="Premier competitive & endurance cycling community."
        )
        db.add(club)
        db.commit()

        print("[CLEANUP SUCCESS] Database cleaned and initialized successfully!")
        print("  - Removed all mock riders, activities, challenges, and mock tokens.")
        print("  - Created clean production schema with foreign keys and indexes.")
        print("  - Application is now in a clean, empty production-ready state.")
    except Exception as e:
        db.rollback()
        print(f"[CLEANUP ERROR] Failed to clean database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    cleanup_database()
