from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.product import Product


class InventoryRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_product_for_update(
            self,
            product_id: int,
    ) -> Product | None:
        statement = (
            select(Product)
            .where(Product.id == product_id)
            .with_for_update()
        )

        return self.db.scalars(statement).first()

    def decrease_stock(
            self,
            product: Product,
            quantity: int,
    ) -> None:
        product.available_stock -= quantity

    def increase_stock(
            self,
            product: Product,
            quantity: int,
    ) -> None:
        product.available_stock += quantity