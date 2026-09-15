from typing import Optional, List, Tuple
from sqlalchemy.orm import Session, joinedload
from uuid import UUID
from app.models.order import Order, OrderStatus
from app.models.order_item import OrderItem
from app.repositories.base import BaseRepository

class OrderRepository(BaseRepository[Order]):
    def __init__(self, db: Session):
        super().__init__(Order, db)

    def get_with_details(self, order_id: UUID) -> Optional[Order]:
        return (
            self.db.query(Order)
            .options(
                joinedload(Order.items),
                joinedload(Order.reservations),
                joinedload(Order.payments),
                joinedload(Order.user)
            )
            .filter(Order.id == order_id)
            .first()
        )

    def get_for_update(self, order_id: UUID) -> Optional[Order]:
        return (
            self.db.query(Order)
            .filter(Order.id == order_id)
            .with_for_update()
            .populate_existing()
            .first()
        )

    def list_user_orders(
        self,
        user_id: UUID,
        skip: int = 0,
        limit: int = 20
    ) -> Tuple[List[Order], int]:
        q = (
            self.db.query(Order)
            .options(
                joinedload(Order.items),
                joinedload(Order.reservations),
                joinedload(Order.user)
            )
            .filter(Order.user_id == user_id)
            .order_by(Order.created_at.desc())
        )
        total = q.count()
        orders = q.offset(skip).limit(limit).all()
        return orders, total

    def list_all_orders(
        self,
        status: Optional[OrderStatus] = None,
        user_id: Optional[UUID] = None,
        skip: int = 0,
        limit: int = 20
    ) -> Tuple[List[Order], int]:
        q = (
            self.db.query(Order)
            .options(
                joinedload(Order.items),
                joinedload(Order.user),
                joinedload(Order.reservations)
            )
        )
        
        if status:
            q = q.filter(Order.status == status)
        if user_id:
            q = q.filter(Order.user_id == user_id)
            
        total = q.count()
        orders = q.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()
        return orders, total
