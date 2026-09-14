from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.payment import PaymentRequest, PaymentResponse
from app.services.payment import PaymentService


router = APIRouter(
    prefix="/payments",
    tags=["Payments"],
)


@router.post(
    "/orders/{order_id}",
    response_model=PaymentResponse,
)
def process_payment(
    order_id: int,
    data: PaymentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = PaymentService(db)

    return service.process_payment(
        order_id=order_id,
        idempotency_key=data.idempotency_key,
        outcome=data.outcome,
    )