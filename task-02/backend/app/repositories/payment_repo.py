from typing import Optional, List
from sqlalchemy.orm import Session
from uuid import UUID
from app.models.payment import Payment
from app.repositories.base import BaseRepository

class PaymentRepository(BaseRepository[Payment]):
    def __init__(self, db: Session):
        super().__init__(Payment, db)

    def get_by_idempotency_key(self, key: str) -> Optional[Payment]:
        return self.db.query(Payment).filter(Payment.idempotency_key == key).first()

    def get_by_order_id(self, order_id: UUID) -> List[Payment]:
        return self.db.query(Payment).filter(Payment.order_id == order_id).order_by(Payment.created_at.desc()).all()
