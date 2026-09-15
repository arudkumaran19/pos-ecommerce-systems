import uuid
from sqlalchemy import Column, String, Text, Numeric, Integer, Boolean, DateTime, CheckConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base

class Product(Base):
    __tablename__ = "products"
    __table_args__ = (
        CheckConstraint("price >= 0", name="ck_products_price_non_negative"),
        CheckConstraint("available_stock >= 0", name="ck_products_stock_non_negative"),
    )
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=False, default="")
    category = Column(String(100), nullable=False, index=True)
    price = Column(Numeric(12, 2), nullable=False, index=True)
    available_stock = Column(Integer, nullable=False)
    image_url = Column(Text, nullable=False, default="")
    is_active = Column(Boolean, nullable=False, default=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
