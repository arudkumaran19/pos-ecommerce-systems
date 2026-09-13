from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

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
            order = self.db.scalars(
                select(Order)
                .where(Order.id == reservation.order_id)
                .with_for_update()
            ).first()

            if order is None:
                continue

            if reservation.status != ReservationStatus.ACTIVE.value:
                continue

            order_items = list(order.items)

            for item in order_items:
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

            expired_count += 1

        self.db.commit()

        return expired_count