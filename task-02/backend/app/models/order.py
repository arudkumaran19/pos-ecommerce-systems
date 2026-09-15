import uuid
import enum
from sqlalchemy import Column, Numeric, DateTime, Enum, ForeignKey, CheckConstraint, JSON, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base

class OrderStatus(str, enum.Enum):
    PENDING = "PENDING"
    RESERVED = "RESERVED"
    PAID = "PAID"
    FAILED = "FAILED"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"

class Order(Base):
    __tablename__ = "orders"
    __table_args__ = (
        CheckConstraint("subtotal >= 0", name="ck_order_subtotal"),
        CheckConstraint("total >= 0", name="ck_order_total"),
    )
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    cart_id = Column(UUID(as_uuid=True), ForeignKey("carts.id", ondelete="SET NULL"), nullable=True)
    status = Column(Enum(OrderStatus, name="order_status"), nullable=False, default=OrderStatus.PENDING, index=True)
    subtotal = Column(Numeric(12, 2), nullable=False)
    shipping_fee = Column(Numeric(12, 2), nullable=False, default=0.00)
    total = Column(Numeric(12, 2), nullable=False)
    shipping_address = Column(JSONB, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    reservations = relationship("Reservation", back_populates="order", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="order")
