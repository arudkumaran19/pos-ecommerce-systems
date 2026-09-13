from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.cart import (
    CartCreate,
    CartItemCreate,
    CartItemUpdate,
    CartResponse,
)
from app.schemas.order import CheckoutResponse
from app.services.cart import CartService
from app.services.checkout import CheckoutService


router = APIRouter(
    prefix="/carts",
    tags=["Carts"],
)


@router.post(
    "",
    response_model=CartResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_cart(
        data: CartCreate,
        db: Session = Depends(get_db),
):
    service = CartService(db)
    return service.create_cart()


@router.post(
    "/{cart_id}/checkout",
    response_model=CheckoutResponse,
)
def checkout(
        cart_id: int,
        db: Session = Depends(get_db),
):
    service = CheckoutService(db)

    order = service.checkout(cart_id)

    return CheckoutResponse(
        order=order,
        reservation_expires_at=order.reservation.expires_at,
    )


@router.get(
    "/{cart_id}",
    response_model=CartResponse,
)
def get_cart(
        cart_id: int,
        db: Session = Depends(get_db),
):
    service = CartService(db)
    return service.get_cart(cart_id)


@router.post(
    "/{cart_id}/items",
    response_model=CartResponse,
)
def add_cart_item(
        cart_id: int,
        data: CartItemCreate,
        db: Session = Depends(get_db),
):
    service = CartService(db)

    return service.add_item(
        cart_id=cart_id,
        data=data,
    )

@router.patch(
    "/{cart_id}/items/{product_id}",
    response_model=CartResponse,
)
def update_cart_item_quantity(
        cart_id: int,
        product_id: int,
        data: CartItemUpdate,
        db: Session = Depends(get_db),
):
    service = CartService(db)

    return service.update_item_quantity(
        cart_id=cart_id,
        product_id=product_id,
        quantity=data.quantity,
    )

@router.delete(
    "/{cart_id}/items/{product_id}",
    response_model=CartResponse,
)
def remove_cart_item(
        cart_id: int,
        product_id: int,
        db: Session = Depends(get_db),
):
    service = CartService(db)

    return service.remove_item(
        cart_id=cart_id,
        product_id=product_id,
    )