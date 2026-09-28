from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone
from app.core.database import get_db
from app.models.models import Challenge, ChallengeParticipant, User, Activity
from app.schemas.schemas import ChallengeResponse

router = APIRouter(prefix="/challenges", tags=["Club Challenges"])

@router.get("", response_model=List[ChallengeResponse])
def list_challenges(db: Session = Depends(get_db)):
    challenges = db.query(Challenge).all()
    results = []

    for c in challenges:
        participants = db.query(ChallengeParticipant).filter(ChallengeParticipant.challenge_id == c.id).all()
        top_parts = []
        for p in participants[:5]:
            top_parts.append({
                "rider_id": p.rider_id,
                "rider_name": p.rider.name if p.rider else "Rider",
                "rider_avatar": p.rider.avatar_url if p.rider else None,
                "progress": p.current_progress,
                "completed": p.completed
            })

        results.append(
            ChallengeResponse(
                id=c.id,
                title=c.title,
                description=c.description,
                challenge_type=c.challenge_type,
                target_metric=c.target_metric,
                target_value=c.target_value,
                start_date=c.start_date,
                end_date=c.end_date,
                status=c.status,
                participant_count=len(participants),
                top_participants=top_parts
            )
        )

    return results

@router.post("/{challenge_id}/join/{rider_id}")
def join_challenge(challenge_id: str, rider_id: str, db: Session = Depends(get_db)):
    challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    user = db.query(User).filter(User.id == rider_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    existing = db.query(ChallengeParticipant)\
        .filter(ChallengeParticipant.challenge_id == challenge_id, ChallengeParticipant.rider_id == rider_id).first()
    if existing:
        return {"message": "Rider already participating in this challenge"}

    participant = ChallengeParticipant(
        challenge_id=challenge_id,
        rider_id=rider_id,
        current_progress=0.0,
        completed=False
    )
    db.add(participant)
    db.commit()

    return {"message": "Joined challenge successfully", "challenge_id": challenge_id, "rider_id": rider_id}
