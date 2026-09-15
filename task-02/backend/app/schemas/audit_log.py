from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from pydantic import Field
from app.schemas.common import BaseSchema

class AuditUserIdentity(BaseSchema):
    id: UUID
    display_name: str
    email: str
    role: str
    is_deleted: bool = False

class AuditLogResponse(BaseSchema):
    id: UUID
    actor_user_id: Optional[UUID] = None
    target_user_id: Optional[UUID] = None
    actor: Optional[AuditUserIdentity] = Field(default=None, validation_alias="actor_display")
    target: Optional[AuditUserIdentity] = Field(default=None, validation_alias="target_display")
    action: str
    entity_type: str
    entity_id: str
    before_data: Optional[Dict[str, Any]] = None
    after_data: Optional[Dict[str, Any]] = None
    reason: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    request_id: Optional[str] = None
    created_at: datetime

