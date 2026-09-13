from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.order import Order
from app.models.order_item import OrderItem


class OrderRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, order_id: int) -> Order | None:
        statement = (
            select(Order)
            .where(Order.id == order_id)
            .options(
                selectinload(Order.items),
                selectinload(Order.reservation),
                selectinload(Order.payment),
            )
        )

        return self.db.scalars(statement).first()

    def get_all(self) -> list[Order]:
        statement = (
            select(Order)
            .order_by(Order.id.desc())
            .options(
                selectinload(Order.items),
                selectinload(Order.reservation),
                selectinload(Order.payment),
            )
        )

        return list(self.db.scalars(statement).all())

    def get_by_cart_id(self, cart_id: int) -> Order | None:
        statement = (
            select(Order)
            .where(Order.cart_id == cart_id)
            .options(
                selectinload(Order.items),
                selectinload(Order.reservation),
                selectinload(Order.payment),
            )
        )

        return self.db.scalars(statement).first()

    def create(
            self,
            cart_id: int,
    ) -> Order:
        order = Order(
            cart_id=cart_id,
        )

        self.db.add(order)
        self.db.flush()

        return order

    def add_item(
            self,
            order_id: int,
            product_id: int,
            quantity: int,
            unit_price,
    ) -> OrderItem:
        item = OrderItem(
            order_id=order_id,
            product_id=product_id,
            quantity=quantity,
            unit_price=unit_price,
        )

        self.db.add(item)
        self.db.flush()

        return item