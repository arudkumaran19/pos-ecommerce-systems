from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from decimal import Decimal
from app.core.database import get_db
from app.schemas.admin import AdminDashboardStats
from app.models.user import User, UserRole
from app.models.product import Product
from app.models.order import Order, OrderStatus
from app.models.reservation import Reservation, ReservationStatus
from app.models.payment import Payment, PaymentStatus
from app.api.deps import require_admin, verify_csrf

router = APIRouter(prefix="/stats", tags=["Admin Statistics"], dependencies=[Depends(require_admin), Depends(verify_csrf)])

@router.get("", response_model=AdminDashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_customers = db.query(User).filter(User.role == UserRole.CUSTOMER, User.deleted_at.is_(None)).count()
    total_products = db.query(Product).count()
    total_orders = db.query(Order).count()
    
    revenue_res = db.query(func.coalesce(func.sum(Order.total), 0)).filter(Order.status == OrderStatus.PAID).scalar()
    total_revenue = Decimal(str(revenue_res or 0.00))
    
    active_reservations = db.query(Reservation).filter(Reservation.status == ReservationStatus.ACTIVE).count()
    pending_orders = db.query(Order).filter(Order.status.in_([OrderStatus.PENDING, OrderStatus.RESERVED])).count()
    failed_payments = db.query(Payment).filter(Payment.status.in_([PaymentStatus.FAILED, PaymentStatus.TIMEOUT])).count()
    
    return AdminDashboardStats(
        total_customers=total_customers,
        total_products=total_products,
        total_orders=total_orders,
        total_revenue=total_revenue,
        active_reservations=active_reservations,
        pending_orders=pending_orders,
        failed_payments=failed_payments
    )
