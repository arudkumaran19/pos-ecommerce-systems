from typing import Optional
from sqlalchemy.orm import Session, joinedload
from uuid import UUID
from app.models.cart import Cart, CartStatus
from app.models.cart_item import CartItem
from app.repositories.base import BaseRepository

class CartRepository(BaseRepository[Cart]):
    def __init__(self, db: Session):
        super().__init__(Cart, db)

    def get_active_cart_for_user(self, user_id: UUID) -> Cart:
        cart = (
            self.db.query(Cart)
            .options(joinedload(Cart.items).joinedload(CartItem.product))
            .filter(Cart.user_id == user_id, Cart.status == CartStatus.ACTIVE)
            .first()
        )
        if not cart:
            cart = Cart(user_id=user_id, status=CartStatus.ACTIVE)
            self.db.add(cart)
            self.db.commit()
            self.db.refresh(cart)
        return cart

    def get_active_cart_for_update(self, user_id: UUID) -> Optional[Cart]:
        cart = (
            self.db.query(Cart)
            .filter(Cart.user_id == user_id, Cart.status == CartStatus.ACTIVE)
            .with_for_update()
            .populate_existing()
            .first()
        )
        if not cart:
            return None
        return (
            self.db.query(Cart)
            .options(joinedload(Cart.items).joinedload(CartItem.product))
            .filter(Cart.id == cart.id)
            .populate_existing()
            .first()
        )

    def get_cart_item(self, cart_id: UUID, product_id: UUID) -> Optional[CartItem]:
        return (
            self.db.query(CartItem)
            .filter(CartItem.cart_id == cart_id, CartItem.product_id == product_id)
            .first()
        )

    def get_cart_item_by_id(self, item_id: UUID) -> Optional[CartItem]:
        return self.db.query(CartItem).filter(CartItem.id == item_id).first()

    def add_or_update_item(self, cart: Cart, product_id: UUID, quantity: int, unit_price) -> CartItem:
        item = self.get_cart_item(cart.id, product_id)
        if item:
            item.quantity += quantity
            item.unit_price = unit_price
        else:
            item = CartItem(
                cart_id=cart.id,
                product_id=product_id,
                quantity=quantity,
                unit_price=unit_price
            )
            self.db.add(item)
        return item

    def remove_item(self, item: CartItem):
        self.db.delete(item)

    def clear_cart(self, cart_id: UUID):
        self.db.query(CartItem).filter(CartItem.cart_id == cart_id).delete()
