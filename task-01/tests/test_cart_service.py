from decimal import Decimal

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.models.product import Product
from app.schemas.cart import CartItemCreate
from app.services.cart import CartService


@pytest.fixture
def db():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    Base.metadata.create_all(engine)

    with Session(engine) as session:
        yield session

    Base.metadata.drop_all(engine)
    engine.dispose()


def create_product(
        db: Session,
        name: str = "Coffee",
        price: Decimal = Decimal("5.50"),
        stock: int = 10,
):
    product = Product(
        name=name,
        price=price,
        available_stock=stock,
    )

    db.add(product)
    db.commit()
    db.refresh(product)

    return product


def test_create_cart(db: Session):
    service = CartService(db)

    cart = service.create_cart()

    assert cart.id is not None
    assert cart.status == "Active"
    assert cart.items == []


def test_add_item_to_cart(db: Session):
    product = create_product(db)
    service = CartService(db)

    cart = service.create_cart()

    updated_cart = service.add_item(
        cart_id=cart.id,
        data=CartItemCreate(
            product_id=product.id,
            quantity=2,
        ),
    )

    assert len(updated_cart.items) == 1
    assert updated_cart.items[0].product_id == product.id
    assert updated_cart.items[0].quantity == 2


def test_add_same_product_increases_quantity(db: Session):
    product = create_product(db)
    service = CartService(db)

    cart = service.create_cart()

    service.add_item(
        cart_id=cart.id,
        data=CartItemCreate(
            product_id=product.id,
            quantity=2,
        ),
    )

    updated_cart = service.add_item(
        cart_id=cart.id,
        data=CartItemCreate(
            product_id=product.id,
            quantity=3,
        ),
    )

    assert len(updated_cart.items) == 1
    assert updated_cart.items[0].quantity == 5


def test_add_item_rejects_insufficient_stock(db: Session):
    product = create_product(db,stock=3)
    service = CartService(db)

    cart = service.create_cart()

    with pytest.raises(Exception) as exc_info:
        service.add_item(
            cart_id=cart.id,
            data=CartItemCreate(
                product_id=product.id,
                quantity=4,
            ),
        )

    assert exc_info.value.status_code == 409


def test_remove_item_from_cart(db: Session):
    product = create_product(db)
    service = CartService(db)

    cart = service.create_cart()

    service.add_item(
        cart_id=cart.id,
        data=CartItemCreate(
            product_id=product.id,
            quantity=2,
        ),
    )

    updated_cart = service.remove_item(
        cart_id=cart.id,
        product_id=product.id,
    )

    assert updated_cart.items == []