from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.order import Order, OrderStatus
from app.models.reservation import Reservation, ReservationStatus
from app.repositories.inventory import InventoryRepository


class ReservationExpiryService:
    def __init__(self, db: Session):
        self.db = db
        self.inventory = InventoryRepository(db)

    def expire_due_reservations(self) -> int:
        now = datetime.now(timezone.utc)

        reservations = self.db.scalars(
            select(Reservation)
            .where(
                Reservation.status == ReservationStatus.ACTIVE.value,
                Reservation.expires_at <= now,
                )
            .with_for_update(skip_locked=True)
        ).all()

        expired_count = 0

        for reservation in reservations:
            try:
                order = self.db.scalars(
                    select(Order)
                    .where(Order.id == reservation.order_id)
                    .with_for_update()
                    .options(selectinload(Order.items))
                ).first()

                if order is None:
                    continue

                # Re-check status inside the lock to guard against races.
                if reservation.status != ReservationStatus.ACTIVE.value:
                    continue

                # Restore stock; lock products in deterministic ID order
                # to avoid deadlocks when multiple reservations share products.
                for item in sorted(order.items, key=lambda i: i.product_id):
                    product = self.inventory.get_product_for_update(
                        item.product_id
                    )

                    if product is not None:
                        self.inventory.increase_stock(
                            product,
                            item.quantity,
                        )

                reservation.status = ReservationStatus.EXPIRED.value
                reservation.released_at = now
                order.status = OrderStatus.EXPIRED.value
                order.completed_at = now

                self.db.flush()
                expired_count += 1

            except Exception as exc:
                # Roll back only this reservation's changes so the rest
                # of the batch can still be processed.
                self.db.rollback()
                print(f"Failed to expire reservation {reservation.id}: {exc}")

        self.db.commit()

        return expired_count