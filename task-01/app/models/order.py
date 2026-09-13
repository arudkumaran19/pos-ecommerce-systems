from enum import Enum

from sqlalchemy import CheckConstraint, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column ,relationship

from app.db.base import Base


class OrderStatus(str, Enum):
    PENDING = "Pending"
    RESERVED = "Reserved"
    PAID = "Paid"
    CANCELLED = "Cancelled"
    EXPIRED = "Expired"
    FAILED = "Failed"


class Order(Base):
    __tablename__ = "orders"

    __table_args__ = (
        CheckConstraint(
            "status IN ('Pending', 'Reserved', 'Paid', 'Cancelled', 'Expired', 'Failed')",
            name="ck_orders_status_valid",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    cart_id: Mapped[int] = mapped_column(
        ForeignKey("carts.id"),
        nullable=False,
        unique=True,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=OrderStatus.PENDING.value,
    )
    items: Mapped[list["OrderItem"]] = relationship(
        back_populates="order",
        cascade="all, delete-orphan",
    )

    reservation: Mapped["Reservation | None"] = relationship(
        back_populates="order",
        cascade="all, delete-orphan",
        uselist=False,
    )

    payment: Mapped["Payment | None"] = relationship(
        back_populates="order",
        cascade="all, delete-orphan",
        uselist=False,
    )