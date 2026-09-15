import uuid
from typing import Tuple, Optional
from decimal import Decimal
from app.schemas.payment import MockPaymentMode
from app.models.payment import PaymentStatus

class MockPaymentGateway:
    """
    Mock payment gateway simulating real-world gateway outcomes:
    - MOCK_SUCCESS -> SUCCEEDED with provider reference
    - MOCK_FAILURE -> FAILED with card decline code
    - MOCK_TIMEOUT -> TIMEOUT simulating network drops or gateway unresponsiveness
    """
    @staticmethod
    def process_payment(
        amount: Decimal,
        mode: MockPaymentMode = MockPaymentMode.MOCK_SUCCESS
    ) -> Tuple[PaymentStatus, Optional[str], Optional[str]]:
        if mode == MockPaymentMode.MOCK_SUCCESS:
            provider_ref = f"mock_tx_{uuid.uuid4().hex[:16]}"
            return PaymentStatus.SUCCEEDED, provider_ref, None
            
        elif mode == MockPaymentMode.MOCK_FAILURE:
            return PaymentStatus.FAILED, None, "Card declined: Insufficient funds or fraud check triggered."
            
        elif mode == MockPaymentMode.MOCK_TIMEOUT:
            return PaymentStatus.TIMEOUT, None, "Gateway connection timed out: 504 Gateway Timeout simulation."
            
        return PaymentStatus.FAILED, None, "Unknown mock payment mode"
