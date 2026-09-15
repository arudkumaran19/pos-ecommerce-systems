from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from decimal import Decimal
from datetime import datetime
import enum
from app.models.payment import PaymentStatus
from app.schemas.common import BaseSchema

class MockPaymentMode(str, enum.Enum):
    MOCK_SUCCESS = "MOCK_SUCCESS"
    MOCK_FAILURE = "MOCK_FAILURE"
    MOCK_TIMEOUT = "MOCK_TIMEOUT"

class PaymentRequest(BaseModel):
    order_id: UUID
    payment_mode: MockPaymentMode = MockPaymentMode.MOCK_SUCCESS
    payment_method: str = "CARD"
    card_last4: Optional[str] = "4242"

class PaymentResponse(BaseSchema):
    id: UUID
    order_id: UUID
    idempotency_key: str
    status: PaymentStatus
    order_status: Optional[str] = None
    amount: Decimal
    provider: str
    provider_reference: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime
