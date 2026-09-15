from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional
from app.core.database import get_db
from app.schemas.order import OrderResponse
from app.schemas.admin import AdminRefundOrderRequest
from app.schemas.common import PaginatedResponse
from app.models.order import OrderStatus
from app.models.user import User
from app.services.order_service import OrderService
from app.api.deps import require_admin, verify_csrf

router = APIRouter(prefix="/orders", tags=["Admin Order Management"], dependencies=[Depends(require_admin), Depends(verify_csrf)])

@router.get("", response_model=PaginatedResponse[OrderResponse])
def admin_list_orders(
    status: Optional[OrderStatus] = Query(None),
    user_id: Optional[UUID] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    svc = OrderService(db)
    orders, total = svc.admin_list_all_orders(status=status, user_id=user_id, page=page, limit=limit)
    total_pages = (total + limit - 1) // limit if total > 0 else 1
    return PaginatedResponse(
        items=orders,
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages
    )

@router.post("/{order_id}/refund", response_model=OrderResponse)
def admin_refund_order(
    order_id: UUID,
    data: AdminRefundOrderRequest,
    request: Request,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    ip = request.client.host if request.client else None
    svc = OrderService(db)
    return svc.cancel_order(
        user=current_admin,
        order_id=order_id,
        reason=f"Admin refund: {data.reason}",
        ip_address=ip
    )
