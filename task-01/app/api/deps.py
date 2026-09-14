from typing import Callable

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.security import SESSION_COOKIE_NAME
from app.db.session import get_db
from app.models.user import User, UserRole
from app.services.auth import AuthService


def get_token_from_request(request: Request) -> str | None:
    """Extract session token from HttpOnly cookie or Authorization Bearer header."""
    # 1. HttpOnly cookie (primary browser mechanism)
    token = request.cookies.get(SESSION_COOKIE_NAME)
    if token:
        return token

    # 2. Authorization Bearer header (supports API testing and HTTP clients)
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header[7:].strip()

    return None


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> User:
    """Verify session token against database and return the active authenticated User."""
    token = get_token_from_request(request)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )

    auth_service = AuthService(db)
    user = auth_service.get_user_by_session_token(token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session. Please sign in again.",
        )

    return user


def require_role(*roles: UserRole) -> Callable[[User], User]:
    """Dependency factory enforcing role-based authorization at the route level."""
    allowed_values = [r.value for r in roles]

    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_values:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Manager permission required for this action",
            )
        return current_user

    return role_checker
