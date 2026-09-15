from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from decimal import Decimal
from datetime import datetime
from app.schemas.common import BaseSchema

class ProductResponse(BaseSchema):
    id: UUID
    name: str
    slug: str
    description: str
    category: str
    price: Decimal
    available_stock: int
    image_url: str
    is_active: bool
    created_at: datetime

class ProductCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    description: str = Field("", max_length=2000)
    category: str = Field(..., min_length=2, max_length=100)
    price: Decimal = Field(..., ge=0)
    available_stock: int = Field(..., ge=0)
    image_url: str = Field("", max_length=2048)
    is_active: bool = True

class ProductUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    category: Optional[str] = Field(None, min_length=2, max_length=100)
    price: Optional[Decimal] = Field(None, ge=0)
    available_stock: Optional[int] = Field(None, ge=0)
    image_url: Optional[str] = Field(None, max_length=2048)
    is_active: Optional[bool] = None

class ProductStockAdjustRequest(BaseModel):
    delta: int
