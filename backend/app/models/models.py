from datetime import datetime, timezone
import uuid
from sqlalchemy import (
    Column, String, Float, Integer, Boolean, DateTime, ForeignKey, Index, Text
)
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Club(Base):
    __tablename__ = "clubs"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    owner_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    slug = Column(String(100), unique=True, nullable=True)
    city = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    logo_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    owner = relationship("User", foreign_keys=[owner_id], back_populates="owned_clubs")
    members = relationship("ClubMember", back_populates="club", cascade="all, delete-orphan")
    activities = relationship("Activity", back_populates="club")
    challenges = relationship("Challenge", back_populates="club")


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    supabase_user_id = Column(String(100), unique=True, nullable=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(150), nullable=False)
    avatar_url = Column(String(500), nullable=True)
    role = Column(String(20), default="MEMBER")  # OWNER, MEMBER
    status = Column(String(20), default="active")  # active, inactive
    leaderboard_opt_in = Column(Boolean, default=True, nullable=False)
    strava_athlete_id = Column(String(50), unique=True, nullable=True, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Compatibility properties for legacy code & schemas
    @property
    def full_name(self) -> str:
        return self.name

    @full_name.setter
    def full_name(self, value: str):
        self.name = value

    @property
    def profile_image(self) -> str:
        return self.avatar_url

    @profile_image.setter
    def profile_image(self, value: str):
        self.avatar_url = value

    @property
    def joined_date(self) -> datetime:
        return self.created_at

    owned_clubs = relationship("Club", foreign_keys=[Club.owner_id], back_populates="owner")
    memberships = relationship("ClubMember", back_populates="user", cascade="all, delete-orphan")
    strava_connection = relationship("StravaConnection", back_populates="user", uselist=False, cascade="all, delete-orphan")
    activities = relationship("Activity", back_populates="user", cascade="all, delete-orphan")
    challenge_participations = relationship("ChallengeParticipant", back_populates="rider", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_users_supabase_id", "supabase_user_id"),
        Index("idx_users_strava_athlete", "strava_athlete_id"),
        Index("idx_users_status", "status"),
    )


class ClubMember(Base):
    __tablename__ = "club_members"

    id = Column(String, primary_key=True, default=generate_uuid)
    club_id = Column(String, ForeignKey("clubs.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(20), default="MEMBER")  # OWNER, MEMBER
    status = Column(String(20), default="active")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    club = relationship("Club", back_populates="members")
    user = relationship("User", back_populates="memberships")

    @property
    def joined_at(self):
        return self.created_at


class StravaConnection(Base):
    __tablename__ = "strava_connections"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    strava_athlete_id = Column(String(50), nullable=False, index=True)
    access_token = Column(String(255), nullable=False)
    refresh_token = Column(String(255), nullable=False)
    expires_at = Column(Integer, nullable=False)
    scope = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="strava_connection")

    @property
    def connected_at(self):
        return self.created_at


class Activity(Base):
    __tablename__ = "activities"

    id = Column(String, primary_key=True, default=generate_uuid)
    strava_activity_id = Column(String(100), unique=True, nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    club_id = Column(String, ForeignKey("clubs.id", ondelete="SET NULL"), nullable=True, index=True)
    
    activity_type = Column(String(50), default="Ride")  # Ride, EBikeRide, VirtualRide, etc.
    name = Column(String(255), nullable=False)
    distance = Column(Float, nullable=False)  # in km
    moving_time = Column(Integer, nullable=False)  # in seconds
    elapsed_time = Column(Integer, nullable=False)  # in seconds
    elevation_gain = Column(Float, nullable=False)  # in meters
    average_speed = Column(Float, nullable=False)  # in km/h
    max_speed = Column(Float, nullable=True, default=0.0)  # in km/h
    calories = Column(Integer, nullable=True, default=0)
    start_date = Column(DateTime, nullable=False, index=True)
    start_latitude = Column(Float, nullable=True)
    start_longitude = Column(Float, nullable=True)
    strava_url = Column(String(500), nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="activities")
    club = relationship("Club", back_populates="activities")

    # Compatibility aliases
    @property
    def rider_id(self) -> str:
        return self.user_id

    @rider_id.setter
    def rider_id(self, value: str):
        self.user_id = value

    @property
    def rider(self):
        return self.user

    @property
    def activity_name(self) -> str:
        return self.name

    @activity_name.setter
    def activity_name(self, value: str):
        self.name = value

    __table_args__ = (
        Index("idx_activities_user_date", "user_id", "start_date"),
        Index("idx_activities_club_date", "club_id", "start_date"),
        Index("idx_activities_strava_id", "strava_activity_id"),
    )


class Challenge(Base):
    __tablename__ = "challenges"

    id = Column(String, primary_key=True, default=generate_uuid)
    club_id = Column(String, ForeignKey("clubs.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    challenge_type = Column(String(50), nullable=False)
    target_metric = Column(String(50), nullable=False)
    target_value = Column(Float, nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    status = Column(String(20), default="active")

    club = relationship("Club", back_populates="challenges")
    participants = relationship("ChallengeParticipant", back_populates="challenge", cascade="all, delete-orphan")


class ChallengeParticipant(Base):
    __tablename__ = "challenge_participants"

    id = Column(String, primary_key=True, default=generate_uuid)
    challenge_id = Column(String, ForeignKey("challenges.id", ondelete="CASCADE"), nullable=False, index=True)
    rider_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    current_progress = Column(Float, default=0.0)
    completed = Column(Boolean, default=False)
    joined_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    challenge = relationship("Challenge", back_populates="participants")
    rider = relationship("User", back_populates="challenge_participations")
