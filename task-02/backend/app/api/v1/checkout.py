from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.order import OrderResponse, CheckoutRequest
from app.models.user import User
from app.services.checkout_service import CheckoutService
from app.api.deps import get_current_user, verify_csrf

router = APIRouter(prefix="/checkout", tags=["Checkout & Stock Reservation"], dependencies=[Depends(verify_csrf)])

@router.post("", response_model=OrderResponse)
def checkout(
    data: CheckoutRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ip = request.client.host if request.client else None
    svc = CheckoutService(db)
    return svc.checkout(
        user=current_user,
        shipping_address=data.shipping_address,
        ip_address=ip
    )
