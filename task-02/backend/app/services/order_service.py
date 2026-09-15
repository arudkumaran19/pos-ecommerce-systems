from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from uuid import UUID
from app.repositories.order_repo import OrderRepository
from app.repositories.reservation_repo import ReservationRepository
from app.repositories.payment_repo import PaymentRepository
from app.repositories.product_repo import ProductRepository
from app.models.order import Order, OrderStatus
from app.models.reservation import ReservationStatus
from app.models.payment import PaymentStatus
from app.models.user import User, UserRole
from app.core.exceptions import NotFoundException, BadRequestException, ConflictException, ForbiddenException
from app.services.audit_service import AuditService

class OrderService:
    def __init__(self, db: Session):
        self.db = db
        self.order_repo = OrderRepository(db)
        self.reservation_repo = ReservationRepository(db)
        self.payment_repo = PaymentRepository(db)
        self.product_repo = ProductRepository(db)
        self.audit_service = AuditService(db)

    def get_order_for_user(self, user: User, order_id: UUID) -> Order:
        order = self.order_repo.get_with_details(order_id)
        if not order:
            raise NotFoundException("Order not found.")
            
        if order.user_id != user.id:
            raise NotFoundException("Order not found.")
            
        # Passive expiry check: If order is RESERVED and 5-min TTL has passed, lazily expire it
        if order.status == OrderStatus.RESERVED:
            now_utc = datetime.now(timezone.utc)
            if any(r.status == ReservationStatus.ACTIVE and r.expires_at <= now_utc for r in order.reservations):
                self._expire_reserved_order(order, now_utc)
                self.db.commit()
                self.db.refresh(order)
                
        return order

    def list_user_orders(self, user: User, page: int = 1, limit: int = 20) -> Tuple[List[Order], int]:
        skip = (page - 1) * limit
        return self.order_repo.list_user_orders(user.id, skip=skip, limit=limit)

    def cancel_order(self, user: User, order_id: UUID, reason: Optional[str] = None, ip_address: Optional[str] = None) -> Order:
        """
        Cancels an order with guaranteed exactly-once stock restoration:
        - If RESERVED: transitions to CANCELLED, ACTIVE reservations to RELEASED, stock restored.
        - If PAID: transitions to CANCELLED, SUCCEEDED payment to REFUNDED, CONSUMED reservations to RELEASED, stock restored.
        """
        locked = self.order_repo.get_for_update(order_id)
        if not locked:
            raise NotFoundException("Order not found.")
        order = self.order_repo.get_with_details(order_id)
        if not order:
            raise NotFoundException("Order not found.")
            
        if order.user_id != user.id and user.role != UserRole.ADMIN:
            raise ForbiddenException("You do not have permission to cancel this order.")
            
        now_utc = datetime.now(timezone.utc)
        
        if order.status == OrderStatus.RESERVED:
            # Cancel before payment
            order.status = OrderStatus.CANCELLED
            for r in order.reservations:
                if r.status == ReservationStatus.ACTIVE:
                    r.status = ReservationStatus.RELEASED
                    r.released_at = now_utc
                    product = self.product_repo.get_by_id(r.product_id)
                    if product:
                        product.available_stock += r.quantity
                        
            self.audit_service.log(
                action="ORDER_CANCELLED",
                entity_type="ORDER",
                entity_id=str(order.id),
                actor_user_id=user.id,
                target_user_id=order.user_id,
                before_data={"status": "RESERVED"},
                after_data={"status": "CANCELLED"},
                reason=reason or "Customer cancellation of reserved order",
                ip_address=ip_address
            )
            self.db.commit()
            self.db.refresh(order)
            return order

        elif order.status == OrderStatus.PAID:
            # Cancel paid order -> Refund simulation
            order.status = OrderStatus.CANCELLED
            
            # Mark payments REFUNDED
            for payment in order.payments:
                if payment.status == PaymentStatus.SUCCEEDED:
                    payment.status = PaymentStatus.REFUNDED
                    
            # Mark reservations RELEASED and restore stock exactly once
            for r in order.reservations:
                if r.status == ReservationStatus.CONSUMED:
                    r.status = ReservationStatus.RELEASED
                    r.released_at = now_utc
                    product = self.product_repo.get_by_id(r.product_id)
                    if product:
                        product.available_stock += r.quantity
                        
            self.audit_service.log(
                action="REFUND_ISSUED",
                entity_type="ORDER",
                entity_id=str(order.id),
                actor_user_id=user.id,
                target_user_id=order.user_id,
                before_data={"status": "PAID"},
                after_data={"status": "CANCELLED", "payment_status": "REFUNDED"},
                reason=reason or "Customer requested cancellation & refund",
                ip_address=ip_address
            )
            self.db.commit()
            self.db.refresh(order)
            return order

        else:
            raise ConflictException(f"Cannot cancel order in status '{order.status.value}'.")

    def _expire_reserved_order(self, order: Order, now_utc: datetime):
        order.status = OrderStatus.EXPIRED
        for r in order.reservations:
            if r.status == ReservationStatus.ACTIVE:
                r.status = ReservationStatus.EXPIRED
                r.released_at = now_utc
                product = self.product_repo.get_by_id(r.product_id)
                if product:
                    product.available_stock += r.quantity
                    
        self.audit_service.log(
            action="ORDER_EXPIRED",
            entity_type="ORDER",
            entity_id=str(order.id),
            target_user_id=order.user_id,
            reason="Reservation TTL elapsed"
        )

    # Admin Methods
    def admin_list_all_orders(
        self,
        status: Optional[OrderStatus] = None,
        user_id: Optional[UUID] = None,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[Order], int]:
        skip = (page - 1) * limit
        return self.order_repo.list_all_orders(status=status, user_id=user_id, skip=skip, limit=limit)
