from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_token_from_request
from app.core.config import settings
from app.core.security import (
    SESSION_COOKIE_NAME,
    get_cookie_security_options,
    login_rate_limiter,
)
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    MessageResponse,
    UserResponse,
)
from app.services.auth import AuthService

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post(
    "/login",
    response_model=LoginResponse,
    status_code=status.HTTP_200_OK,
)
def login(
    data: LoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    client_ip = request.client.host if request.client else "unknown"
    rate_limit_key = f"{client_ip}:{data.email.strip().lower()}"

    # 1. Enforce rate limiting before checking credentials
    login_rate_limiter.check(rate_limit_key)

    auth_service = AuthService(db)

    try:
        user = auth_service.authenticate_user(
            email=data.email,
            password=data.password,
        )
    except Exception:
        # Record failure for brute-force tracking
        login_rate_limiter.record_failure(rate_limit_key)
        raise

    # 2. Reset failures on successful authentication
    login_rate_limiter.reset(rate_limit_key)

    # 3. Create server-side session
    session, raw_token = auth_service.create_session(user.id)

    # 4. Set HttpOnly session cookie
    cookie_options = get_cookie_security_options()
    max_age_seconds = settings.session_expire_minutes * 60

    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=raw_token,
        max_age=max_age_seconds,
        **cookie_options,
    )

    return LoginResponse(
        message="Login successful",
        user=UserResponse.model_validate(user),
    )


@router.post(
    "/logout",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
)
def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    token = get_token_from_request(request)
    if token:
        auth_service = AuthService(db)
        auth_service.revoke_session(token)

    # Clear HttpOnly cookie on client
    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        path="/",
    )

    return MessageResponse(message="Logged out successfully")


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
)
def get_me(
    current_user: User = Depends(get_current_user),
):
    return UserResponse.model_validate(current_user)
