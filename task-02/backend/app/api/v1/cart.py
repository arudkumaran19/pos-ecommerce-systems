from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from uuid import UUID
from app.core.database import get_db
from app.schemas.cart import (
    CartResponse,
    AddCartItemRequest,
    UpdateCartItemRequest
)
from app.models.user import User
from app.services.cart_service import CartService
from app.api.deps import get_current_user, verify_csrf

router = APIRouter(prefix="/cart", tags=["Cart Management"], dependencies=[Depends(verify_csrf)])

@router.get("", response_model=CartResponse)
def get_cart(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    svc = CartService(db)
    return svc.get_cart_payload(current_user.id)

@router.post("/items", response_model=CartResponse)
def add_cart_item(
    data: AddCartItemRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    svc = CartService(db)
    return svc.add_item(current_user.id, data.product_id, data.quantity)

@router.patch("/items/{item_id}", response_model=CartResponse)
def update_cart_item(
    item_id: UUID,
    data: UpdateCartItemRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    svc = CartService(db)
    return svc.update_item_quantity(current_user.id, item_id, data.quantity)

@router.delete("/items/{item_id}", response_model=CartResponse)
def remove_cart_item(
    item_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    svc = CartService(db)
    return svc.remove_item(current_user.id, item_id)

@router.delete("", response_model=CartResponse)
def clear_cart(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    svc = CartService(db)
    return svc.clear_cart(current_user.id)
