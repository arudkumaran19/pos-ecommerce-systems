from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class OrderItemResponse(BaseModel):
    product_id: int
    quantity: int
    unit_price: Decimal

    model_config = ConfigDict(
        from_attributes=True,
    )


class OrderResponse(BaseModel):
    id: int
    cart_id: int
    status: str
    items: list[OrderItemResponse]

    model_config = ConfigDict(
        from_attributes=True,
    )


class CheckoutResponse(BaseModel):
    order: OrderResponse
    reservation_expires_at: datetime