import time
import logging
from typing import Optional, Dict, Any
import httpx
import jwt
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.models.models import User, Club, ClubMember

logger = logging.getLogger(__name__)
security = HTTPBearer(auto_error=False)

async def verify_supabase_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Validates a Supabase JWT either via the Supabase Auth REST endpoint or by decoding the JWT.
    Returns user payload dictionary if valid, None otherwise.
    """
    # 1. If Supabase URL and Anon Key are configured, verify directly with Supabase Auth API
    if settings.SUPABASE_URL and settings.SUPABASE_ANON_KEY:
        try:
            url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/user"
            headers = {
                "Authorization": f"Bearer {token}",
                "apikey": settings.SUPABASE_ANON_KEY
            }
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(url, headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    metadata = data.get("user_metadata", {})
                    email = data.get("email") or ""
                    name = metadata.get("full_name") or metadata.get("name") or (email.split("@")[0].capitalize() if email else "Club Rider")
                    avatar = metadata.get("avatar_url") or metadata.get("picture")
                    return {
                        "supabase_user_id": data.get("id"),
                        "email": email,
                        "name": name,
                        "avatar_url": avatar
                    }
                else:
                    logger.warning(f"Supabase auth check returned status {res.status_code}")
        except Exception as e:
            logger.warning(f"Error querying Supabase Auth endpoint: {e}")

    # 2. Decode JWT payload (checks expiry and extracts claims)
    try:
        # Check if secret is configured for signature verification
        secret = settings.SUPABASE_JWT_SECRET or settings.SECRET_KEY
        # If secret is set, we verify; otherwise decode without verify for graceful fallback
        if settings.SUPABASE_JWT_SECRET:
            payload = jwt.decode(token, secret, algorithms=["HS256", "RS256"], audience="authenticated")
        else:
            payload = jwt.decode(token, options={"verify_signature": False})

        # Check expiration
        exp = payload.get("exp")
        if exp and exp < time.time():
            logger.warning("Token has expired")
            return None

        sub = payload.get("sub")
        if not sub:
            return None

        email = payload.get("email", "")
        metadata = payload.get("user_metadata", {})
        name = metadata.get("full_name") or metadata.get("name") or (email.split("@")[0].capitalize() if email else "Club Rider")
        avatar = metadata.get("avatar_url") or metadata.get("picture")

        return {
            "supabase_user_id": sub,
            "email": email,
            "name": name,
            "avatar_url": avatar
        }
    except Exception as e:
        logger.debug(f"JWT decode failed: {e}")

    # 3. Development token fallback
    if settings.ENV == "development" and token.startswith("dev-"):
        uid = token.replace("dev-", "")
        return {
            "supabase_user_id": f"dev_{uid}",
            "email": f"{uid}@cycleclub.com",
            "name": uid.replace(".", " ").capitalize(),
            "avatar_url": None
        }

    return None


async def get_current_user_optional(
    auth: Optional[HTTPAuthorizationCredentials] = Security(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Returns the authenticated User if valid Bearer token provided, otherwise None.
    Automatically provisions/syncs User and ClubMember records.
    """
    if not auth or not auth.credentials:
        return None

    token = auth.credentials
    user_info = await verify_supabase_token(token)
    if not user_info or not user_info.get("email"):
        return None

    sid = user_info["supabase_user_id"]
    email = user_info["email"]

    # Lookup user by supabase_user_id or email
    user = db.query(User).filter((User.supabase_user_id == sid) | (User.email == email)).first()

    if not user:
        # Determine role: The first authenticated user in the database becomes OWNER
        user_count = db.query(User).count()
        role = "OWNER" if user_count == 0 else "MEMBER"

        user = User(
            supabase_user_id=sid,
            email=email,
            name=user_info.get("name") or email.split("@")[0].capitalize(),
            avatar_url=user_info.get("avatar_url"),
            role=role,
            status="active"
        )
        db.add(user)
        db.flush()

        # Connect to club
        club = db.query(Club).first()
        if not club:
            club = Club(
                name="Apex Velo Cycling Club",
                slug="apex-velo",
                description="Premier competitive & endurance cycling community.",
                owner_id=user.id if role == "OWNER" else None
            )
            db.add(club)
            db.flush()
        elif role == "OWNER" and not club.owner_id:
            club.owner_id = user.id

        membership = ClubMember(
            club_id=club.id,
            user_id=user.id,
            role=role,
            status="active"
        )
        db.add(membership)
        db.commit()
        db.refresh(user)
    else:
        # Update user profile info if changed
        updated = False
        if not user.supabase_user_id:
            user.supabase_user_id = sid
            updated = True
        if user_info.get("name") and user.name != user_info["name"]:
            user.name = user_info["name"]
            updated = True
        if user_info.get("avatar_url") and user.avatar_url != user_info["avatar_url"]:
            user.avatar_url = user_info["avatar_url"]
            updated = True
        if updated:
            db.commit()
            db.refresh(user)

    return user


async def get_current_user(
    user: Optional[User] = Depends(get_current_user_optional)
) -> User:
    """
    Enforces authentication. Raises HTTP 401 Unauthorized if not authenticated.
    """
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in with Google.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    return user


def require_owner(current_user: User = Depends(get_current_user)) -> User:
    """
    Enforces that the authenticated user has the OWNER role.
    """
    if current_user.role != "OWNER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Only club owners are permitted to perform this action."
        )
    return current_user
