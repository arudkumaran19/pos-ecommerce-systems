import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    actor_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    target_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(64), nullable=False, index=True)
    entity_type = Column(String(64), nullable=False)
    entity_id = Column(String(64), nullable=False)
    before_data = Column(JSONB, nullable=True)
    after_data = Column(JSONB, nullable=True)
    reason = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    request_id = Column(String(64), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    # Relationships
    actor = relationship("User", foreign_keys=[actor_user_id])
    target = relationship("User", foreign_keys=[target_user_id])

    @property
    def actor_display(self):
        if not self.actor_user_id:
            return None
        if self.actor:
            return {
                "id": self.actor.id,
                "display_name": "Deleted account" if self.actor.deleted_at is not None else self.actor.full_name,
                "email": self.actor.email,
                "role": self.actor.role.value if hasattr(self.actor.role, "value") else str(self.actor.role),
                "is_deleted": self.actor.deleted_at is not None
            }
        return {
            "id": self.actor_user_id,
            "display_name": "Deleted account",
            "email": "deleted@account.invalid",
            "role": "UNKNOWN",
            "is_deleted": True
        }

    @property
    def target_display(self):
        if not self.target_user_id:
            return None
        if self.target:
            return {
                "id": self.target.id,
                "display_name": "Deleted account" if self.target.deleted_at is not None else self.target.full_name,
                "email": self.target.email,
                "role": self.target.role.value if hasattr(self.target.role, "value") else str(self.target.role),
                "is_deleted": self.target.deleted_at is not None
            }
        return {
            "id": self.target_user_id,
            "display_name": "Deleted account",
            "email": "deleted@account.invalid",
            "role": "UNKNOWN",
            "is_deleted": True
        }

