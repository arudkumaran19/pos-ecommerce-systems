from typing import Optional, List, Tuple
from sqlalchemy.orm import Session, joinedload
from uuid import UUID
from datetime import datetime
from app.models.audit_log import AuditLog


class AuditLogRepository:
    """
    Append-only repository for system audit logging.
    Strictly prohibits UPDATE and DELETE operations.
    """
    def __init__(self, db: Session):
        self.db = db

    def log_event(
        self,
        action: str,
        entity_type: str,
        entity_id: str,
        actor_user_id: Optional[UUID] = None,
        target_user_id: Optional[UUID] = None,
        before_data: Optional[dict] = None,
        after_data: Optional[dict] = None,
        reason: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        request_id: Optional[str] = None
    ) -> AuditLog:
        audit = AuditLog(
            actor_user_id=actor_user_id,
            target_user_id=target_user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            before_data=before_data,
            after_data=after_data,
            reason=reason,
            ip_address=ip_address,
            user_agent=user_agent,
            request_id=request_id
        )
        self.db.add(audit)
        return audit

    def list_logs(
        self,
        actor_user_id: Optional[UUID] = None,
        target_user_id: Optional[UUID] = None,
        action: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> Tuple[List[AuditLog], int]:
        q = self.db.query(AuditLog)
        
        if actor_user_id:
            q = q.filter(AuditLog.actor_user_id == actor_user_id)
        if target_user_id:
            q = q.filter(AuditLog.target_user_id == target_user_id)
        if action:
            q = q.filter(AuditLog.action.ilike(f"%{action}%"))
            
        total = q.count()
        logs = (
            q.options(joinedload(AuditLog.actor), joinedload(AuditLog.target))
            .order_by(AuditLog.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        return logs, total
