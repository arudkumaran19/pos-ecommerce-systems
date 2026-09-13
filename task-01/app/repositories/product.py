from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.product import Product


class ProductRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, product_id: int) -> Product | None:
        return self.db.get(Product, product_id)

    def get_all(self) -> list[Product]:
        statement = select(Product).order_by(Product.id)
        return list(self.db.scalars(statement).all())

    def create(
            self,
            name: str,
            price,
            available_stock: int,
    ) -> Product:
        product = Product(
            name=name,
            price=price,
            available_stock=available_stock,
        )

        self.db.add(product)
        self.db.flush()

        return product

    def delete(self, product: Product) -> None:
        self.db.delete(product)
        self.db.flush()