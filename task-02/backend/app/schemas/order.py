from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from uuid import UUID
from decimal import Decimal
from datetime import datetime
from app.models.order import OrderStatus
from app.models.reservation import ReservationStatus
from app.schemas.common import BaseSchema

class OrderItemResponse(BaseSchema):
    id: UUID
    product_id: UUID
    product_name: str
    unit_price: Decimal
    quantity: int
    subtotal: Decimal

class ReservationResponse(BaseSchema):
    id: UUID
    product_id: UUID
    quantity: int
    status: ReservationStatus
    expires_at: datetime
    created_at: datetime

class OrderCustomerIdentity(BaseSchema):
    id: UUID
    full_name: str
    email: str

class OrderResponse(BaseSchema):
    id: UUID
    user_id: UUID
    customer: Optional[OrderCustomerIdentity] = Field(default=None, validation_alias="user")
    status: OrderStatus
    subtotal: Decimal
    shipping_fee: Decimal
    total: Decimal
    shipping_address: Dict[str, Any]
    items: List[OrderItemResponse]
    reservations: List[ReservationResponse] = []
    created_at: datetime
    updated_at: datetime


class CheckoutRequest(BaseModel):
    shipping_address: Dict[str, Any] = Field(default_factory=lambda: {
        "full_name": "Demo Customer",
        "address_line1": "123 High Street",
        "city": "London",
        "postal_code": "SW1A 1AA",
        "country": "UK"
    })
