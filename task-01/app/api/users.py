from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import require_role
from app.core.security import hash_password, validate_password_strength
from app.db.session import get_db
from app.models.user import User, UserRole, UserSession
from app.schemas.auth import (
    MessageResponse,
    UserCreate,
    UserResponse,
    UserUpdate,
)

router = APIRouter(
    prefix="/users",
    tags=["User Management"],
)


@router.get(
    "",
    response_model=list[UserResponse],
    status_code=status.HTTP_200_OK,
)
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.MANAGER)),
):
    """List all registered operators (Manager only)."""
    users = db.query(User).order_by(User.id.asc()).all()
    return [UserResponse.model_validate(u) for u in users]


@router.post(
    "",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_user(
    data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.MANAGER)),
):
    """Create a new operator account with email, password, display name, and role (Manager only)."""
    cleaned_email = data.email.strip().lower()

    if not cleaned_email or "@" not in cleaned_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid email address is required.",
        )

    # Validate role
    valid_roles = [UserRole.CASHIER.value, UserRole.MANAGER.value]
    if data.role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Role must be one of {valid_roles}",
        )

    # Validate password strength (min 12 chars)
    validate_password_strength(data.password)

    # Check for existing email
    existing = db.query(User).filter(User.email == cleaned_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An operator with this email address already exists.",
        )

    hashed = hash_password(data.password)
    user = User(
        email=cleaned_email,
        hashed_password=hashed,
        display_name=data.display_name.strip(),
        role=data.role,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return UserResponse.model_validate(user)


@router.patch(
    "/{user_id}",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
)
def update_user(
    user_id: int,
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.MANAGER)),
):
    """Update operator details, role, status, or reset password (Manager only)."""
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Operator not found",
        )

    # Safeguard against self-lockout
    if target_user.id == current_user.id:
        if data.is_active is False:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot deactivate your own account.",
            )
        if data.role is not None and data.role != UserRole.MANAGER.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot demote your own account.",
            )

    if data.display_name is not None:
        target_user.display_name = data.display_name.strip()

    if data.role is not None:
        valid_roles = [UserRole.CASHIER.value, UserRole.MANAGER.value]
        if data.role not in valid_roles:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Role must be one of {valid_roles}",
            )
        target_user.role = data.role

    if data.password is not None:
        validate_password_strength(data.password)
        target_user.hashed_password = hash_password(data.password)
        # Revoke all active sessions on password change for security
        db.query(UserSession).filter(
            UserSession.user_id == target_user.id,
            UserSession.revoked_at.is_(None),
        ).update(
            {"revoked_at": datetime.now(timezone.utc)},
            synchronize_session=False,
        )

    if data.is_active is not None:
        target_user.is_active = data.is_active
        # When deactivating, revoke all active sessions immediately
        if not data.is_active:
            db.query(UserSession).filter(
                UserSession.user_id == target_user.id,
                UserSession.revoked_at.is_(None),
            ).update(
                {"revoked_at": datetime.now(timezone.utc)},
                synchronize_session=False,
            )

    db.commit()
    db.refresh(target_user)

    return UserResponse.model_validate(target_user)


@router.delete(
    "/{user_id}",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.MANAGER)),
):
    """Delete an operator account (Manager only). Cascades sessions and unlinks orders."""
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Operator not found",
        )

    if target_user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account.",
        )

    db.delete(target_user)
    db.commit()

    return MessageResponse(message="Operator account deleted successfully")
