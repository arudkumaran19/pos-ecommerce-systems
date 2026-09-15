from typing import List, Optional
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime, timezone
from app.models.reservation import Reservation, ReservationStatus
from app.repositories.base import BaseRepository

class ReservationRepository(BaseRepository[Reservation]):
    def __init__(self, db: Session):
        super().__init__(Reservation, db)

    def get_by_order(self, order_id: UUID) -> List[Reservation]:
        return self.db.query(Reservation).filter(Reservation.order_id == order_id).all()

    def get_active_by_order(self, order_id: UUID) -> List[Reservation]:
        return (
            self.db.query(Reservation)
            .filter(Reservation.order_id == order_id, Reservation.status == ReservationStatus.ACTIVE)
            .with_for_update()
            .populate_existing()
            .all()
        )

    def get_expired_active_reservations(self, current_time: Optional[datetime] = None) -> List[Reservation]:
        if not current_time:
            current_time = datetime.now(timezone.utc)
        return (
            self.db.query(Reservation)
            .filter(
                Reservation.status == ReservationStatus.ACTIVE,
                Reservation.expires_at <= current_time
            )
            .with_for_update()
            .populate_existing()
            .all()
        )
