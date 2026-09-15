import asyncio
import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.repositories.reservation_repo import ReservationRepository
from app.repositories.product_repo import ProductRepository
from app.repositories.order_repo import OrderRepository
from app.models.reservation import ReservationStatus
from app.models.order import OrderStatus
from app.services.audit_service import AuditService
from app.core.config import settings

logger = logging.getLogger("sweeper_service")

def sweep_expired_reservations_once(db: Session) -> int:
    """
    Executes a single sweep pass for expired 5-minute reservations.
    Restores stock to products and marks reservations & orders as EXPIRED.
    Returns the number of expired reservations processed.
    """
    res_repo = ReservationRepository(db)
    prod_repo = ProductRepository(db)
    order_repo = OrderRepository(db)
    audit_svc = AuditService(db)
    
    now_utc = datetime.now(timezone.utc)
    expired_reservations = res_repo.get_expired_active_reservations(now_utc)
    
    if not expired_reservations:
        return 0
        
    orders_to_expire = set()
    
    for r in expired_reservations:
        if r.status == ReservationStatus.ACTIVE:
            r.status = ReservationStatus.EXPIRED
            r.released_at = now_utc
            orders_to_expire.add(r.order_id)

    product_ids = sorted({r.product_id for r in expired_reservations if r.status == ReservationStatus.EXPIRED and r.released_at == now_utc})
    locked_products = {p.id: p for p in prod_repo.get_for_update_multi(product_ids)}
    for r in expired_reservations:
        if r.status == ReservationStatus.EXPIRED and r.released_at == now_utc:
            product = locked_products.get(r.product_id)
            if product:
                product.available_stock += r.quantity
            
    for order_id in orders_to_expire:
        order = order_repo.get_by_id(order_id)
        if order and order.status == OrderStatus.RESERVED:
            order.status = OrderStatus.EXPIRED
            audit_svc.log(
                action="ORDER_EXPIRED",
                entity_type="ORDER",
                entity_id=str(order.id),
                target_user_id=order.user_id,
                reason="Periodic sweeper expired 5-minute reservation"
            )
            
    db.commit()
    return len(expired_reservations)

async def start_periodic_reservation_sweeper():
    """
    Background daemon running periodically every 15-30 seconds
    to release expired 5-minute reservations and restore product stock.
    """
    logger.info(f"Starting reservation expiry sweeper (interval: {settings.SWEEPER_INTERVAL_SECONDS}s)")
    while True:
        try:
            db = SessionLocal()
            try:
                count = sweep_expired_reservations_once(db)
                if count > 0:
                    logger.info(f"Sweeper released {count} expired stock reservations.")
            finally:
                db.close()
        except Exception as e:
            logger.error(f"Sweeper error during execution: {e}")
            
        await asyncio.sleep(settings.SWEEPER_INTERVAL_SECONDS)
