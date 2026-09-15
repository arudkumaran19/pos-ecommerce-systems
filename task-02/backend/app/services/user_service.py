from typing import Optional
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from uuid import UUID
from fastapi import UploadFile
from app.repositories.user_repo import UserRepository
from app.repositories.session_repo import SessionRepository
from app.models.user import User, UserRole
from app.core.security import hash_password, verify_password, hash_token
from app.core.storage import save_avatar, delete_avatar
from app.core.exceptions import (
    BadRequestException,
    UnauthorizedException,
    ForbiddenException,
    ConflictException,
    NotFoundException
)
from app.services.audit_service import AuditService

class UserService:
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)
        self.session_repo = SessionRepository(db)
        self.audit_service = AuditService(db)

    def update_profile(self, user: User, full_name: str, ip_address: Optional[str] = None) -> User:
        before = {"full_name": user.full_name}
        user.full_name = full_name.strip()
        self.audit_service.log(
            action="PROFILE_UPDATED",
            entity_type="USER",
            entity_id=str(user.id),
            actor_user_id=user.id,
            target_user_id=user.id,
            before_data=before,
            after_data={"full_name": user.full_name},
            ip_address=ip_address
        )
        self.db.commit()
        self.db.refresh(user)
        return user

    def upload_avatar(self, user: User, file: UploadFile, ip_address: Optional[str] = None) -> User:
        if user.avatar_url:
            delete_avatar(user.avatar_url)
            
        new_avatar_url = save_avatar(file, str(user.id))
        user.avatar_url = new_avatar_url
        self.audit_service.log(
            action="AVATAR_UPDATED",
            entity_type="USER",
            entity_id=str(user.id),
            actor_user_id=user.id,
            target_user_id=user.id,
            after_data={"avatar_url": new_avatar_url},
            ip_address=ip_address
        )
        self.db.commit()
        self.db.refresh(user)
        return user

    def remove_avatar(self, user: User, ip_address: Optional[str] = None) -> User:
        if user.avatar_url:
            delete_avatar(user.avatar_url)
            user.avatar_url = None
            self.audit_service.log(
                action="AVATAR_REMOVED",
                entity_type="USER",
                entity_id=str(user.id),
                actor_user_id=user.id,
                target_user_id=user.id,
                ip_address=ip_address
            )
            self.db.commit()
            self.db.refresh(user)
        return user

    def change_email(self, user: User, new_email: str, current_password: str, ip_address: Optional[str] = None) -> User:
        if not verify_password(current_password, user.password_hash):
            raise UnauthorizedException("Current password verification failed.")
            
        normalized = new_email.strip().lower()
        if normalized == user.email.lower():
            return user
            
        existing = self.user_repo.get_by_email(normalized)
        if existing:
            raise ConflictException("An account with this email address already exists.")
            
        before = {"email": user.email}
        user.email = normalized
        self.audit_service.log(
            action="EMAIL_CHANGED",
            entity_type="USER",
            entity_id=str(user.id),
            actor_user_id=user.id,
            target_user_id=user.id,
            before_data=before,
            after_data={"email": user.email},
            ip_address=ip_address
        )
        self.db.commit()
        self.db.refresh(user)
        return user

    def change_password(
        self,
        user: User,
        current_password: str,
        new_password: str,
        current_raw_token: Optional[str] = None,
        ip_address: Optional[str] = None
    ):
        if not verify_password(current_password, user.password_hash):
            raise UnauthorizedException("Current password verification failed.")
            
        user.password_hash = hash_password(new_password)
        # Revoke all other sessions; keep the current one (hash the raw cookie token first)
        except_hash = hash_token(current_raw_token) if current_raw_token else None
        self.session_repo.revoke_all_for_user(user.id, except_token_hash=except_hash)
        self.audit_service.log(
            action="PASSWORD_CHANGED",
            entity_type="USER",
            entity_id=str(user.id),
            actor_user_id=user.id,
            target_user_id=user.id,
            ip_address=ip_address
        )
        self.db.commit()

    def delete_account(self, user: User, ip_address: Optional[str] = None):
        # Admin safeguard: Admin cannot self-delete account
        if user.role == UserRole.ADMIN:
            raise ForbiddenException("Administrators cannot delete their own account.")
            
        # Soft delete & Anonymize personal info
        before = {"email": user.email, "full_name": user.full_name}
        user.is_active = False
        user.deleted_at = datetime.now(timezone.utc)
        user.email = f"deleted_{user.id}@deleted.invalid"
        user.full_name = "Deleted User"
        if user.avatar_url:
            delete_avatar(user.avatar_url)
            user.avatar_url = None
            
        self.session_repo.revoke_all_for_user(user.id)
        self.audit_service.log(
            action="ACCOUNT_DELETED",
            entity_type="USER",
            entity_id=str(user.id),
            actor_user_id=user.id,
            target_user_id=user.id,
            before_data=before,
            reason="User self-deletion with anonymization",
            ip_address=ip_address
        )
        self.db.commit()

    # Admin Management Methods
    def admin_update_user_status(self, actor: User, target_id: UUID, is_active: bool, reason: Optional[str] = None) -> User:
        if actor.id == target_id:
            raise ForbiddenException("Administrators cannot deactivate or alter their own account status.")
            
        target = self.user_repo.get_by_id(target_id)
        if not target or target.deleted_at is not None:
            raise NotFoundException("User not found.")
            
        if target.role == UserRole.ADMIN and not is_active:
            # Check last active admin safeguard
            if self.user_repo.count_active_admins() <= 1:
                raise ConflictException("Cannot deactivate the last active administrator.")
                
        before = {"is_active": target.is_active}
        target.is_active = is_active
        if not is_active:
            self.session_repo.revoke_all_for_user(target.id)

        action = "ADMIN_USER_REACTIVATED" if is_active else "ADMIN_USER_SUSPENDED"
        self.audit_service.log(
            action=action,
            entity_type="USER",
            entity_id=str(target.id),
            actor_user_id=actor.id,
            target_user_id=target.id,
            before_data=before,
            after_data={"is_active": is_active},
            reason=reason
        )
        self.db.commit()
        self.db.refresh(target)
        return target

    def admin_update_user_role(self, actor: User, target_id: UUID, new_role: UserRole, reason: Optional[str] = None) -> User:
        if actor.id == target_id:
            raise ForbiddenException("Administrators cannot alter their own role.")
            
        target = self.user_repo.get_by_id(target_id)
        if not target or target.deleted_at is not None:
            raise NotFoundException("User not found.")
            
        if target.role == UserRole.ADMIN and new_role != UserRole.ADMIN:
            if self.user_repo.count_active_admins() <= 1:
                raise ConflictException("Cannot demote the last active administrator.")
                
        before = {"role": target.role.value}
        target.role = new_role
        self.audit_service.log(
            action="ADMIN_ROLE_CHANGED",
            entity_type="USER",
            entity_id=str(target.id),
            actor_user_id=actor.id,
            target_user_id=target.id,
            before_data=before,
            after_data={"role": new_role.value},
            reason=reason
        )
        self.db.commit()
        self.db.refresh(target)
        return target

    def admin_reset_password(self, actor: User, target_id: UUID, new_password: str) -> User:
        if actor.id == target_id:
            raise ForbiddenException("Administrators must use self-service password change for their own account.")
            
        target = self.user_repo.get_by_id(target_id)
        if not target or target.deleted_at is not None:
            raise NotFoundException("User not found.")
            
        target.password_hash = hash_password(new_password)
        self.session_repo.revoke_all_for_user(target.id)
        self.audit_service.log(
            action="ADMIN_PASSWORD_RESET",
            entity_type="USER",
            entity_id=str(target.id),
            actor_user_id=actor.id,
            target_user_id=target.id
        )
        self.db.commit()
        return target
