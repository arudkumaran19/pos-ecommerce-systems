from typing import Optional, Dict, Any, List, Tuple
from sqlalchemy.orm import Session
from uuid import UUID
from app.repositories.audit_log_repo import AuditLogRepository
from app.models.audit_log import AuditLog

class AuditService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = AuditLogRepository(db)

    def log(
        self,
        action: str,
        entity_type: str,
        entity_id: str,
        actor_user_id: Optional[UUID] = None,
        target_user_id: Optional[UUID] = None,
        before_data: Optional[Dict[str, Any]] = None,
        after_data: Optional[Dict[str, Any]] = None,
        reason: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        request_id: Optional[str] = None
    ) -> AuditLog:
        return self.repo.log_event(
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id),
            actor_user_id=actor_user_id,
            target_user_id=target_user_id,
            before_data=before_data,
            after_data=after_data,
            reason=reason,
            ip_address=ip_address,
            user_agent=user_agent,
            request_id=request_id
        )

    def list_logs(
        self,
        actor_user_id: Optional[UUID] = None,
        target_user_id: Optional[UUID] = None,
        action: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> Tuple[List[AuditLog], int]:
        return self.repo.list_logs(
            actor_user_id=actor_user_id,
            target_user_id=target_user_id,
            action=action,
            skip=skip,
            limit=limit
        )
