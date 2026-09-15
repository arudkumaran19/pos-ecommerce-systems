from pydantic import BaseModel, Field
from typing import List
from uuid import UUID
from decimal import Decimal
from datetime import datetime
from app.models.cart import CartStatus
from app.schemas.common import BaseSchema
from app.schemas.product import ProductResponse

class CartItemResponse(BaseSchema):
    id: UUID
    product_id: UUID
    quantity: int
    unit_price: Decimal
    subtotal: Decimal
    product: ProductResponse

class CartResponse(BaseSchema):
    id: UUID
    user_id: UUID
    status: CartStatus
    items: List[CartItemResponse]
    total_quantity: int
    subtotal: Decimal
    updated_at: datetime

class AddCartItemRequest(BaseModel):
    product_id: UUID
    quantity: int = Field(1, ge=1, le=99)

class UpdateCartItemRequest(BaseModel):
    quantity: int = Field(..., ge=1, le=99)
