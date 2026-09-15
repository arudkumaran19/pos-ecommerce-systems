from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session
from uuid import UUID
from app.core.database import get_db
from app.schemas.order import OrderResponse
from app.schemas.common import PaginatedResponse
from app.models.user import User
from app.services.order_service import OrderService
from app.api.deps import get_current_user, verify_csrf

router = APIRouter(prefix="/orders", tags=["Order History & Details"], dependencies=[Depends(verify_csrf)])

@router.get("", response_model=PaginatedResponse[OrderResponse])
def list_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    svc = OrderService(db)
    orders, total = svc.list_user_orders(current_user, page=page, limit=limit)
    total_pages = (total + limit - 1) // limit if total > 0 else 1
    return PaginatedResponse(
        items=orders,
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages
    )

@router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    svc = OrderService(db)
    return svc.get_order_for_user(current_user, order_id)

@router.post("/{order_id}/cancel", response_model=OrderResponse)
def cancel_order(
    order_id: UUID,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ip = request.client.host if request.client else None
    svc = OrderService(db)
    return svc.cancel_order(current_user, order_id, ip_address=ip)
