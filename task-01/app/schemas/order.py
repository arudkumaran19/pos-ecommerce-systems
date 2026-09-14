from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, model_validator


class OrderItemResponse(BaseModel):
    product_id: int
    product_name: str
    quantity: int
    unit_price: Decimal

    model_config = ConfigDict(
        from_attributes=True,
    )


class HandledByResponse(BaseModel):
    """Safe public projection of the operator who created the order.

    Deliberately excludes hashed_password, session tokens and any other
    sensitive fields — only the display-safe attributes are exposed.
    """

    id: int
    display_name: str
    email: str
    role: str

    model_config = ConfigDict(
        from_attributes=True,
    )


class OrderResponse(BaseModel):
    id: int
    cart_id: int
    status: str
    items: list[OrderItemResponse]
    created_at: datetime
    completed_at: Optional[datetime] = None
    # None means a legacy/pre-authentication order — never attribute to viewer.
    handled_by: Optional[HandledByResponse] = None

    model_config = ConfigDict(
        from_attributes=True,
    )

    @model_validator(mode="before")
    @classmethod
    def _map_user_to_handled_by(cls, values):
        """Map the ORM relationship ``order.user`` -> ``handled_by``.

        Pydantic model_validator receives the raw ORM object when
        ``from_attributes=True`` is active.  We extract ``user`` and
        surface it as ``handled_by`` so the API field name is stable
        without renaming the SQLAlchemy relationship.
        """
        if hasattr(values, "user"):
            # ORM object path — inject the aliased attribute.
            if not hasattr(values, "handled_by"):
                object.__setattr__(values, "handled_by", values.user)
        elif isinstance(values, dict) and "handled_by" not in values:
            values["handled_by"] = values.get("user")
        return values


class CheckoutResponse(BaseModel):
    order: OrderResponse
    reservation_expires_at: datetime