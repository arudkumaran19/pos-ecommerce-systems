import uuid
import enum
from sqlalchemy import Column, String, Numeric, DateTime, Enum, ForeignKey, Text, CheckConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    SUCCEEDED = "SUCCEEDED"
    FAILED = "FAILED"
    TIMEOUT = "TIMEOUT"
    REFUNDED = "REFUNDED"

class Payment(Base):
    __tablename__ = "payments"
    __table_args__ = (
        CheckConstraint("amount >= 0", name="ck_payment_amount"),
    )
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="RESTRICT"), nullable=False, index=True)
    idempotency_key = Column(String(128), ForeignKey("idempotency_records.key", ondelete="RESTRICT"), nullable=False, unique=True, index=True)
    status = Column(Enum(PaymentStatus, name="payment_status"), nullable=False, default=PaymentStatus.PENDING, index=True)
    amount = Column(Numeric(12, 2), nullable=False)
    provider = Column(String(50), nullable=False, default="MOCK_GATEWAY")
    provider_reference = Column(String(255), nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    order = relationship("Order", back_populates="payments")
    idempotency_record = relationship("IdempotencyRecord")
