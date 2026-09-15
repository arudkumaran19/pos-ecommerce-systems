from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.core.database import Base

class IdempotencyRecord(Base):
    __tablename__ = "idempotency_records"
    
    key = Column(String(128), primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    endpoint = Column(String(100), nullable=False)
    request_hash = Column(String(64), nullable=False)
    status = Column(String(20), nullable=False)  # 'IN_PROGRESS', 'COMPLETED'
    response_code = Column(Integer, nullable=True)
    response_body = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
