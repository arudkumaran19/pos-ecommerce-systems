from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.order import Order, OrderStatus
from app.models.reservation import Reservation, ReservationStatus
from app.repositories.inventory import InventoryRepository


class ReservationService:
    def __init__(self, db: Session):
        self.db = db
        self.inventory = InventoryRepository(db)

    def release_reservation(
            self,
            order_id: int,
            expired: bool = False,
    ) -> Reservation:
        order = self.db.scalars(
            select(Order)
            .where(Order.id == order_id)
            .with_for_update()
            .options(
                selectinload(Order.reservation),
                selectinload(Order.items),
            )
        ).first()

        if order is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found",
            )

        reservation = order.reservation

        if reservation is None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Order has no reservation",
            )

        # Idempotent release.
        # If another process already released/expired it,
        # don't restore stock a second time.
        if reservation.status != ReservationStatus.ACTIVE.value:
            return reservation

        # Lock every product before restoring inventory.
        order_items = sorted(
            order.items,
            key=lambda item: item.product_id,
        )

        for item in order_items:
            product = self.inventory.get_product_for_update(
                item.product_id,
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

        now = datetime.now(timezone.utc)

        reservation.status = (
            ReservationStatus.EXPIRED.value
            if expired
            else ReservationStatus.RELEASED.value
        )

        reservation.released_at = now

        order.status = (
            OrderStatus.EXPIRED.value
            if expired
            else OrderStatus.FAILED.value
        )

        self.db.commit()

        return reservation