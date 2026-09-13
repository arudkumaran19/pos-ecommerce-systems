from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.cart import Cart
from app.models.order import Order, OrderStatus
from app.models.order_item import OrderItem
from app.models.reservation import Reservation, ReservationStatus
from app.repositories.inventory import InventoryRepository
from app.repositories.order import OrderRepository


RESERVATION_MINUTES = 5


class CheckoutService:
    def __init__(self, db: Session):
        self.db = db
        self.inventory = InventoryRepository(db)
        self.orders = OrderRepository(db)

    def checkout(self, cart_id: int) -> Order:
        # Lock the cart so two checkout requests cannot
        # simultaneously create an order for the same cart.
        cart = self.db.scalars(
            select(Cart)
            .where(Cart.id == cart_id)
            .with_for_update()
            .options(selectinload(Cart.items))
        ).first()

        if cart is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cart not found",
            )

        if cart.status != "Active":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cart is not active",
            )

        if not cart.items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot checkout an empty cart",
            )

        # Database-level unique constraint on orders.cart_id
        # is the final protection against duplicate orders.
        existing_order = self.orders.get_by_cart_id(cart_id)

        if existing_order is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Order already exists for this cart",
            )

        # Always lock products in deterministic ID order.
        # This reduces deadlock risk when multiple checkouts
        # contain overlapping products.
        cart_items = sorted(
            cart.items,
            key=lambda item: item.product_id,
        )

        locked_products = []

        for cart_item in cart_items:
            product = self.inventory.get_product_for_update(
                cart_item.product_id,
            )

            if product is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=(
                        f"Product {cart_item.product_id} not found"
                    ),
                )

            if product.available_stock < cart_item.quantity:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        f"Insufficient stock for product "
                        f"{product.id}"
                    ),
                )

            locked_products.append(
                (cart_item, product),
            )

        # Create the order while all required product rows
        # remain locked inside the same transaction.
        order = self.orders.create(cart_id=cart.id)

        for cart_item, product in locked_products:
            self.orders.add_item(
                order_id=order.id,
                product_id=product.id,
                quantity=cart_item.quantity,
                unit_price=product.price,
            )

            self.inventory.decrease_stock(
                product,
                cart_item.quantity,
            )

        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(
            minutes=RESERVATION_MINUTES,
        )

        reservation = Reservation(
            order_id=order.id,
            created_at=now,
            expires_at=expires_at,
            status=ReservationStatus.ACTIVE.value,
        )

        self.db.add(reservation)

        order.status = OrderStatus.RESERVED.value

        # Cart is no longer modifiable after checkout.
        cart.status = "CheckedOut"

        self.db.commit()

        return self.orders.get_by_id(order.id)