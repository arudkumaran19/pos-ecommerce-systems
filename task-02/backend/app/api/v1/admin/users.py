from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional
from app.core.database import get_db
from app.schemas.user import UserResponse
from app.schemas.admin import (
    AdminUserStatusUpdate,
    AdminUserRoleUpdate,
    AdminResetPasswordRequest
)
from app.schemas.common import PaginatedResponse, MessageResponse
from app.models.user import User, UserRole
from app.services.user_service import UserService
from app.repositories.user_repo import UserRepository
from app.api.deps import require_admin, verify_csrf

router = APIRouter(prefix="/users", tags=["Admin User Management"], dependencies=[Depends(require_admin), Depends(verify_csrf)])

@router.get("", response_model=PaginatedResponse[UserResponse])
def list_users(
    query: Optional[str] = Query(None),
    role: Optional[UserRole] = Query(None),
    is_active: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    repo = UserRepository(db)
    skip = (page - 1) * limit
    users, total = repo.search_users(query=query, role=role, is_active=is_active, skip=skip, limit=limit)
    total_pages = (total + limit - 1) // limit if total > 0 else 1
    return PaginatedResponse(
        items=users,
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages
    )

@router.patch("/{user_id}/status", response_model=UserResponse)
def update_user_status(
    user_id: UUID,
    data: AdminUserStatusUpdate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    svc = UserService(db)
    return svc.admin_update_user_status(
        actor=current_admin,
        target_id=user_id,
        is_active=data.is_active,
        reason=data.reason
    )

@router.patch("/{user_id}/role", response_model=UserResponse)
def update_user_role(
    user_id: UUID,
    data: AdminUserRoleUpdate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    svc = UserService(db)
    return svc.admin_update_user_role(
        actor=current_admin,
        target_id=user_id,
        new_role=data.role,
        reason=data.reason
    )

@router.post("/{user_id}/reset-password", response_model=MessageResponse)
def admin_reset_password(
    user_id: UUID,
    data: AdminResetPasswordRequest,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    svc = UserService(db)
    svc.admin_reset_password(
        actor=current_admin,
        target_id=user_id,
        new_password=data.new_password
    )
    return MessageResponse(message="User password has been administratively reset.")
