from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional
from app.core.database import get_db
from app.schemas.audit_log import AuditLogResponse
from app.schemas.common import PaginatedResponse
from app.services.audit_service import AuditService
from app.api.deps import require_admin, verify_csrf

router = APIRouter(prefix="/audit-logs", tags=["Admin Audit Log Viewer"], dependencies=[Depends(require_admin), Depends(verify_csrf)])

@router.get("", response_model=PaginatedResponse[AuditLogResponse])
def list_audit_logs(
    actor_id: Optional[UUID] = Query(None),
    target_id: Optional[UUID] = Query(None),
    action: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    svc = AuditService(db)
    skip = (page - 1) * limit
    logs, total = svc.list_logs(
        actor_user_id=actor_id,
        target_user_id=target_id,
        action=action,
        skip=skip,
        limit=limit
    )
    total_pages = (total + limit - 1) // limit if total > 0 else 1
    return PaginatedResponse(
        items=logs,
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages
    )
