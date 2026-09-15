from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.payment import PaymentRequest, PaymentResponse
from app.models.user import User
from app.services.payment_service import PaymentService
from app.api.deps import get_current_user, verify_csrf, get_idempotency_key

router = APIRouter(prefix="/payments", tags=["Payment Processing"], dependencies=[Depends(verify_csrf)])

@router.post("", response_model=PaymentResponse)
def process_payment(
    data: PaymentRequest,
    request: Request,
    idempotency_key: str = Depends(get_idempotency_key),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ip = request.client.host if request.client else None
    svc = PaymentService(db)
    return svc.process_payment(
        user=current_user,
        order_id=data.order_id,
        idempotency_key=idempotency_key,
        payment_mode=data.payment_mode,
        payment_method=data.payment_method,
        ip_address=ip
    )
