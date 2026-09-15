from fastapi import Request, Depends, Header
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.core.config import settings
from app.core.exceptions import UnauthorizedException, ForbiddenException, BadRequestException
from app.models.user import User, UserRole
from app.models.user_session import UserSession
from app.services.session_service import SessionService

def get_session_token_from_request(request: Request) -> Optional[str]:
    # Check production __Host- cookie first, then fallback
    token = request.cookies.get(f"__Host-{settings.SESSION_COOKIE_NAME}")
    if not token:
        token = request.cookies.get(settings.SESSION_COOKIE_NAME)
    return token

def get_current_session(
    request: Request,
    db: Session = Depends(get_db)
) -> UserSession:
    token = get_session_token_from_request(request)
    if not token:
        raise UnauthorizedException("Authentication required. Please log in.")
        
    session_svc = SessionService(db)
    session = session_svc.validate_session(token)
    if not session:
        raise UnauthorizedException("Session has expired or is invalid. Please log in again.")
    return session

def get_current_user(
    session: UserSession = Depends(get_current_session)
) -> User:
    user = session.user
    if not user or not user.is_active or user.deleted_at is not None:
        raise UnauthorizedException("User account is deactivated or deleted.")
    return user

def require_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    if current_user.role != UserRole.ADMIN:
        raise ForbiddenException("Administrative privileges required.")
    return current_user

def verify_csrf(
    request: Request,
    session: UserSession = Depends(get_current_session),
    x_csrf_token: Optional[str] = Header(None, alias="X-CSRF-Token")
):
    """
    CSRF Protection: For state-changing HTTP methods,
    verifies that the X-CSRF-Token header matches the session's CSRF token.
    """
    if request.method in {"POST", "PATCH", "DELETE", "PUT"}:
        # Skip CSRF check for login and register endpoints
        path = request.url.path
        if path.endswith("/auth/login") or path.endswith("/auth/register") or path.endswith("/auth/forgot-password") or path.endswith("/auth/reset-password"):
            return
            
        if not x_csrf_token or x_csrf_token != session.csrf_token:
            raise ForbiddenException("CSRF verification failed. Invalid or missing CSRF token.")

def get_idempotency_key(
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key")
) -> str:
    if not idempotency_key:
        raise BadRequestException("Idempotency-Key header is required for this operation.")
    return idempotency_key.strip()
