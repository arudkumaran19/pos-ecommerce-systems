import uuid
from sqlalchemy import Column, String, Integer, Numeric, ForeignKey, UniqueConstraint, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class OrderItem(Base):
    __tablename__ = "order_items"
    __table_args__ = (
        UniqueConstraint("order_id", "product_id", name="uq_order_product"),
        CheckConstraint("quantity > 0", name="ck_order_item_qty"),
        CheckConstraint("subtotal >= 0", name="ck_order_item_subtotal"),
    )
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="RESTRICT"), nullable=False)
    product_name = Column(String(255), nullable=False)  # Immutable snapshot
    unit_price = Column(Numeric(12, 2), nullable=False) # Immutable snapshot
    quantity = Column(Integer, nullable=False)
    subtotal = Column(Numeric(12, 2), nullable=False)
    
    # Relationships
    order = relationship("Order", back_populates="items")
    product = relationship("Product")
