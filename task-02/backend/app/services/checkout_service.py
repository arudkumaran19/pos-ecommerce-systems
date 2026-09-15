from typing import Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from uuid import UUID
from decimal import Decimal
from app.repositories.cart_repo import CartRepository
from app.repositories.product_repo import ProductRepository
from app.repositories.order_repo import OrderRepository
from app.repositories.reservation_repo import ReservationRepository
from app.models.cart import CartStatus
from app.models.order import Order, OrderStatus
from app.models.order_item import OrderItem
from app.models.reservation import Reservation, ReservationStatus
from app.models.user import User
from app.core.config import settings
from app.core.exceptions import (
    BadRequestException,
    InsufficientStockException,
    ProductInactiveException
)
from app.services.audit_service import AuditService

class CheckoutService:
    def __init__(self, db: Session):
        self.db = db
        self.cart_repo = CartRepository(db)
        self.product_repo = ProductRepository(db)
        self.order_repo = OrderRepository(db)
        self.reservation_repo = ReservationRepository(db)
        self.audit_service = AuditService(db)

    def checkout(
        self,
        user: User,
        shipping_address: Dict[str, Any],
        ip_address: str = None
    ) -> Order:
        """
        Executes atomic checkout with deterministic row-level locking:
        1. Validates active cart has items.
        2. Sorts product IDs ascending to eliminate deadlocks.
        3. Acquires FOR UPDATE row locks in sorted order.
        4. Validates product active status and stock availability.
        5. Atomically decrements product stock.
        6. Snapshots product names and unit prices into OrderItems.
        7. Creates 5-minute Stock Reservations.
        8. Creates Order in RESERVED status.
        9. Marks Cart as CONVERTED.
        10. Commits transaction and releases row locks immediately.
        """
        cart = self.cart_repo.get_active_cart_for_update(user.id)
        if not cart or not cart.items:
            raise BadRequestException("Your cart is empty. Add items before checking out.")
            
        # Extract and sort unique product IDs
        product_ids = sorted(list({item.product_id for item in cart.items}))
        
        # Acquire row-level locks in sorted ascending order
        locked_products = self.product_repo.get_for_update_multi(product_ids)
        product_map = {p.id: p for p in locked_products}
        
        # Validate stock and active status
        for item in cart.items:
            product = product_map.get(item.product_id)
            if not product or not product.is_active:
                p_name = product.name if product else "Unknown"
                raise ProductInactiveException(p_name)
                
            if product.available_stock < item.quantity:
                raise InsufficientStockException(
                    product_name=product.name,
                    requested=item.quantity,
                    available=product.available_stock
                )
                
        # Decrement stock and calculate financial totals
        subtotal = Decimal("0.00")
        for item in cart.items:
            product = product_map[item.product_id]
            product.available_stock -= item.quantity
            subtotal += product.price * item.quantity
            
        shipping_fee = Decimal("0.00")
        total = subtotal + shipping_fee
        
        # Create Order in RESERVED status
        order = Order(
            user_id=user.id,
            cart_id=cart.id,
            status=OrderStatus.RESERVED,
            subtotal=subtotal,
            shipping_fee=shipping_fee,
            total=total,
            shipping_address=shipping_address
        )
        self.order_repo.add(order)
        self.db.flush()  # Generate order.id
        
        # 5-minute reservation TTL
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=settings.RESERVATION_TTL_SECONDS)
        
        # Create immutable OrderItems snapshots and Reservations
        for item in cart.items:
            product = product_map[item.product_id]
            item_subtotal = product.price * item.quantity
            
            order_item = OrderItem(
                order_id=order.id,
                product_id=product.id,
                product_name=product.name, # Frozen snapshot
                unit_price=product.price,  # Frozen snapshot
                quantity=item.quantity,
                subtotal=item_subtotal
            )
            self.db.add(order_item)
            
            reservation = Reservation(
                order_id=order.id,
                product_id=product.id,
                quantity=item.quantity,
                status=ReservationStatus.ACTIVE,
                expires_at=expires_at
            )
            self.reservation_repo.add(reservation)
            
        # Convert cart
        cart.status = CartStatus.CONVERTED
        
        self.audit_service.log(
            action="CHECKOUT_RESERVED",
            entity_type="ORDER",
            entity_id=str(order.id),
            actor_user_id=user.id,
            target_user_id=user.id,
            after_data={"subtotal": str(subtotal), "total": str(total), "expires_at": expires_at.isoformat()},
            ip_address=ip_address
        )
        # Commit transaction releasing all row locks
        self.db.commit()
        self.db.refresh(order)
        return order
