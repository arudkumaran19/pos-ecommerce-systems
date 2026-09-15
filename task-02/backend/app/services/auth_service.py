from typing import Optional, Tuple
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from app.repositories.user_repo import UserRepository
from app.repositories.session_repo import SessionRepository
from app.models.user import User, UserRole
from app.core.security import hash_password, verify_password, generate_session_token, hash_token
from app.core.exceptions import (
    BadRequestException,
    UnauthorizedException,
    ConflictException
)
from app.services.session_service import SessionService
from app.services.audit_service import AuditService

class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)
        self.session_repo = SessionRepository(db)
        self.session_service = SessionService(db)
        self.audit_service = AuditService(db)

    def register(
        self,
        email: str,
        full_name: str,
        password: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Tuple[User, str, str]:
        normalized_email = email.strip().lower()
        existing = self.user_repo.get_by_email(normalized_email)
        if existing:
            raise ConflictException("An account with this email already exists.")
        
        # Check if first user; if so, make ADMIN, otherwise CUSTOMER
        total_users = self.user_repo.count()
        role = UserRole.ADMIN if total_users == 0 else UserRole.CUSTOMER
        
        pwd_hash = hash_password(password)
        user = User(
            email=normalized_email,
            full_name=full_name.strip(),
            password_hash=pwd_hash,
            role=role,
            is_active=True
        )
        self.user_repo.add(user)
        self.db.flush()
        self.audit_service.log(
            action="USER_REGISTERED",
            entity_type="USER",
            entity_id=str(user.id),
            actor_user_id=user.id,
            target_user_id=user.id,
            after_data={"email": user.email, "role": user.role.value},
            ip_address=ip_address,
            user_agent=user_agent
        )
        self.db.commit()
        self.db.refresh(user)
        
        raw_session_token, csrf_token = self.session_service.create_session(user, ip_address, user_agent)
        return user, raw_session_token, csrf_token

    def login(
        self,
        email: str,
        password: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Tuple[User, str, str]:
        normalized_email = email.strip().lower()
        user = self.user_repo.get_by_email(normalized_email)
        
        if not user or not verify_password(password, user.password_hash):
            self.audit_service.log(
                action="LOGIN_FAILURE",
                entity_type="AUTH",
                entity_id=normalized_email,
                reason="Invalid credentials",
                ip_address=ip_address,
                user_agent=user_agent
            )
            self.db.commit()
            raise UnauthorizedException("Invalid email or password.")
            
        if not user.is_active or user.deleted_at is not None:
            self.audit_service.log(
                action="LOGIN_FAILURE",
                entity_type="AUTH",
                entity_id=str(user.id),
                actor_user_id=user.id,
                reason="Account suspended or deleted",
                ip_address=ip_address,
                user_agent=user_agent
            )
            self.db.commit()
            raise UnauthorizedException("This account has been deactivated. Please contact support.")
            
        raw_session_token, csrf_token = self.session_service.create_session(user, ip_address, user_agent)
        
        self.audit_service.log(
            action="LOGIN_SUCCESS",
            entity_type="USER",
            entity_id=str(user.id),
            actor_user_id=user.id,
            target_user_id=user.id,
            ip_address=ip_address,
            user_agent=user_agent
        )
        self.db.commit()
        return user, raw_session_token, csrf_token

    def request_password_reset(self, email: str, ip_address: Optional[str] = None) -> Optional[str]:
        """
        Generates a reset token if user exists.
        Returns generic anti-enumeration response to caller.
        """
        normalized_email = email.strip().lower()
        user = self.user_repo.get_by_email(normalized_email)
        
        token_for_dev = None
        if user and user.is_active and user.deleted_at is None:
            raw_token = generate_session_token()
            token_hash = hash_token(raw_token)
            expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
            self.session_repo.create_reset_token(token_hash, user.id, expires_at)
            self.db.commit()
            
            self.audit_service.log(
                action="PASSWORD_RESET_REQUESTED",
                entity_type="USER",
                entity_id=str(user.id),
                actor_user_id=user.id,
                target_user_id=user.id,
                ip_address=ip_address
            )
            token_for_dev = raw_token
            
        return token_for_dev

    def complete_password_reset(self, token: str, new_password: str, ip_address: Optional[str] = None):
        token_hash = hash_token(token)
        reset_record = self.session_repo.get_valid_reset_token(token_hash)
        if not reset_record:
            raise BadRequestException("Invalid or expired password reset token.")
            
        user = self.user_repo.get_by_id(reset_record.user_id)
        if not user or not user.is_active or user.deleted_at is not None:
            raise BadRequestException("User account is inactive or not found.")
            
        user.password_hash = hash_password(new_password)
        reset_record.used_at = datetime.now(timezone.utc)
        
        # Revoke all existing sessions upon password reset
        self.session_repo.revoke_all_for_user(user.id)
        self.db.commit()
        
        self.audit_service.log(
            action="PASSWORD_RESET_COMPLETED",
            entity_type="USER",
            entity_id=str(user.id),
            actor_user_id=user.id,
            target_user_id=user.id,
            ip_address=ip_address
        )
