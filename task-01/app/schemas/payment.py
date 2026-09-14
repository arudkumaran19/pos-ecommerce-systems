from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.services.payment import PaymentOutcome


class PaymentRequest(BaseModel):
    idempotency_key: str = Field(
        min_length=1,
        max_length=255,
    )

    outcome: PaymentOutcome


class PaymentResponse(BaseModel):
    id: int
    order_id: int
    idempotency_key: str
    status: str
    processed_at: Optional[datetime] = None

    model_config = {
        "from_attributes": True,
    }