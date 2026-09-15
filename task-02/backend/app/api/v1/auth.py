from fastapi import APIRouter, Depends, Response, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    AuthSuccessResponse,
    CsrfTokenResponse
)
from app.schemas.common import MessageResponse
from app.services.auth_service import AuthService
from app.services.session_service import SessionService
from app.api.deps import get_session_token_from_request, get_current_session
from app.models.user_session import UserSession


router = APIRouter(prefix="/auth", tags=["Authentication"])

def set_auth_cookie(response: Response, raw_token: str):
    # Cookie name: in production with HTTPS uses __Host- prefix
    cookie_name = f"__Host-{settings.SESSION_COOKIE_NAME}" if settings.SESSION_COOKIE_SECURE else settings.SESSION_COOKIE_NAME
    response.set_cookie(
        key=cookie_name,
        value=raw_token,
        max_age=settings.SESSION_MAX_AGE_SECONDS,
        httponly=True,
        secure=settings.SESSION_COOKIE_SECURE,
        samesite=settings.SESSION_COOKIE_SAMESITE,
        path="/"
    )

def clear_auth_cookie(response: Response):
    cookie_name = f"__Host-{settings.SESSION_COOKIE_NAME}" if settings.SESSION_COOKIE_SECURE else settings.SESSION_COOKIE_NAME
    response.delete_cookie(key=cookie_name, path="/")
    # Also clear alternative cookie if set
    response.delete_cookie(key=settings.SESSION_COOKIE_NAME, path="/")

@router.post("/register", response_model=AuthSuccessResponse)
def register(
    data: RegisterRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")
    svc = AuthService(db)
    user, raw_token, csrf_token = svc.register(
        email=data.email,
        full_name=data.full_name,
        password=data.password,
        ip_address=ip,
        user_agent=ua
    )
    set_auth_cookie(response, raw_token)
    return AuthSuccessResponse(message="Registration successful.", csrf_token=csrf_token)

@router.post("/login", response_model=AuthSuccessResponse)
def login(
    data: LoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")
    svc = AuthService(db)
    user, raw_token, csrf_token = svc.login(
        email=data.email,
        password=data.password,
        ip_address=ip,
        user_agent=ua
    )
    set_auth_cookie(response, raw_token)
    return AuthSuccessResponse(message="Login successful.", csrf_token=csrf_token)

@router.post("/logout", response_model=MessageResponse)
def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    token = get_session_token_from_request(request)
    if token:
        session_svc = SessionService(db)
        session_svc.revoke_session(token)
    clear_auth_cookie(response)
    return MessageResponse(message="Logged out successfully.")

@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(
    data: ForgotPasswordRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    ip = request.client.host if request.client else None
    svc = AuthService(db)
    svc.request_password_reset(data.email, ip_address=ip)
    # Anti-enumeration response: always return generic message
    return MessageResponse(
        message="If an account exists for that email, password reset instructions have been sent."
    )

@router.post("/reset-password", response_model=MessageResponse)
def reset_password(
    data: ResetPasswordRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    ip = request.client.host if request.client else None
    svc = AuthService(db)
    svc.complete_password_reset(data.token, data.new_password, ip_address=ip)
    clear_auth_cookie(response)
    return MessageResponse(message="Password has been reset successfully. Please log in with your new password.")

@router.get("/csrf", response_model=CsrfTokenResponse)
def get_csrf_token(
    session: UserSession = Depends(get_current_session)
):
    """
    Returns the active CSRF token for the authenticated user session.
    Enables frontend session restoration without exposing tokens in localStorage.
    """
    return CsrfTokenResponse(csrf_token=session.csrf_token)

