from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.order import Order, OrderStatus
from app.models.payment import PaymentStatus
from app.models.reservation import ReservationStatus
from app.repositories.inventory import InventoryRepository
from app.repositories.order import OrderRepository

ALLOWED_TRANSITIONS = {
    OrderStatus.PENDING.value: {
        OrderStatus.RESERVED.value,
        OrderStatus.CANCELLED.value,
        OrderStatus.FAILED.value,
        OrderStatus.EXPIRED.value,
    },
    OrderStatus.RESERVED.value: {
        OrderStatus.PAID.value,
        OrderStatus.CANCELLED.value,
        OrderStatus.FAILED.value,
        OrderStatus.EXPIRED.value,
    },
    OrderStatus.PAID.value: {
        OrderStatus.CANCELLED.value,
    },
    OrderStatus.CANCELLED.value: set(),
    OrderStatus.EXPIRED.value: set(),
    OrderStatus.FAILED.value: set(),
}


class OrderService:
    def __init__(self, db: Session):
        self.db = db
        self.inventory = InventoryRepository(db)
        self.orders = OrderRepository(db)

    def transition_status(
            self,
            order: Order,
            new_status: str,
    ) -> None:
        allowed = ALLOWED_TRANSITIONS.get(
            order.status,
            set(),
        )

        if new_status not in allowed:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    f"Invalid order status transition: "
                    f"{order.status} -> {new_status}"
                ),
            )

        order.status = new_status


    def get_orders(self) -> list[Order]:
        return self.orders.get_all()

    def get_order(self, order_id: int) -> Order:
        order = self.orders.get_by_id(order_id)

        if order is None:
            raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
        return order

    def cancel_order(self, order_id: int) -> Order:
        order = self.db.scalars(
            select(Order)
            .where(Order.id == order_id)
            .with_for_update()
            .options(
                selectinload(Order.items),
                selectinload(Order.reservation),
                selectinload(Order.payment),
            )
        ).first()

        if order is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found",
            )

        if order.status not in {
            OrderStatus.RESERVED.value,
            OrderStatus.PAID.value,
        }:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    f"Order cannot be cancelled from status "
                    f"{order.status}"
                ),
            )

        reservation = order.reservation

        # Restore inventory for both Reserved and Paid orders.
        if reservation is not None and reservation.status in {
            ReservationStatus.ACTIVE.value,
            ReservationStatus.CONSUMED.value,
        }:
            for item in sorted(
                    order.items,
                    key=lambda item: item.product_id,
            ):
                product = self.inventory.get_product_for_update(
                    item.product_id
                )

                if product is None:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Product {item.product_id} not found",
                    )

                self.inventory.increase_stock(
                    product,
                    item.quantity,
                )

            reservation.status = ReservationStatus.RELEASED.value
            reservation.released_at = datetime.now(
                timezone.utc
            )

        # Mark the payment as Refunded when cancelling a previously paid order.
        if order.status == OrderStatus.PAID.value and order.payment is not None:
            order.payment.status = PaymentStatus.REFUNDED.value

        self.transition_status(
            order,
            OrderStatus.CANCELLED.value,
        )

        order.completed_at = datetime.now(timezone.utc)

        self.db.commit()

        return order