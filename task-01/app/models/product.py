from decimal import Decimal

from sqlalchemy import CheckConstraint, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column ,relationship

from app.db.base import Base


class Product(Base):
    __tablename__ = "products"

    __table_args__ = (
        CheckConstraint("price >= 0", name="ck_products_price_non_negative"),
        CheckConstraint(
            "available_stock >= 0",
            name="ck_products_stock_non_negative",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    price: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )
    available_stock: Mapped[int] = mapped_column(
        nullable=False,
        default=0,
    )
    cart_items: Mapped[list["CartItem"]] = relationship(
        back_populates="product",
    )
    order_items: Mapped[list["OrderItem"]] = relationship(
        back_populates="product",
    )