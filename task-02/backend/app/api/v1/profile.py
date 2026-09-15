from fastapi import APIRouter, Depends, UploadFile, File, Request, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.user import (
    UserResponse,
    UpdateProfileRequest,
    ChangeEmailRequest,
    ChangePasswordRequest
)
from app.schemas.common import MessageResponse
from app.models.user import User
from app.models.user_session import UserSession
from app.services.user_service import UserService
from app.api.deps import (
    get_current_user,
    get_current_session,
    verify_csrf,
    get_session_token_from_request
)
from app.api.v1.auth import clear_auth_cookie
from app.core.exceptions import BadRequestException

router = APIRouter(prefix="/profile", tags=["Customer Profile"], dependencies=[Depends(verify_csrf)])

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    session: UserSession = Depends(get_current_session)
):
    resp = UserResponse.model_validate(current_user)
    resp.csrf_token = session.csrf_token
    return resp


@router.patch("/me", response_model=UserResponse)
def update_profile(
    data: UpdateProfileRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ip = request.client.host if request.client else None
    svc = UserService(db)
    return svc.update_profile(current_user, data.full_name, ip_address=ip)

@router.post("/change-email", response_model=UserResponse)
def change_email(
    data: ChangeEmailRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ip = request.client.host if request.client else None
    svc = UserService(db)
    return svc.change_email(current_user, data.new_email, data.current_password, ip_address=ip)

@router.post("/change-password", response_model=MessageResponse)
def change_password(
    data: ChangePasswordRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if data.new_password != data.confirm_new_password:
        raise BadRequestException("New passwords do not match.")
        
    token = get_session_token_from_request(request)
    ip = request.client.host if request.client else None
    svc = UserService(db)
    svc.change_password(
        user=current_user,
        current_password=data.current_password,
        new_password=data.new_password,
        current_raw_token=token,
        ip_address=ip
    )
    return MessageResponse(message="Password changed successfully. Other sessions have been revoked.")

@router.post("/avatar", response_model=UserResponse)
def upload_avatar(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ip = request.client.host if request.client else None
    svc = UserService(db)
    return svc.upload_avatar(current_user, file, ip_address=ip)

@router.delete("/avatar", response_model=UserResponse)
def remove_avatar(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ip = request.client.host if request.client else None
    svc = UserService(db)
    return svc.remove_avatar(current_user, ip_address=ip)

@router.delete("/account", response_model=MessageResponse)
def delete_account(
    request: Request,
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ip = request.client.host if request.client else None
    svc = UserService(db)
    svc.delete_account(current_user, ip_address=ip)
    clear_auth_cookie(response)
    return MessageResponse(message="Account has been permanently deleted and personal data anonymized.")
