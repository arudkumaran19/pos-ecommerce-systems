from typing import Dict, Any
from sqlalchemy.orm import Session
from uuid import UUID
from decimal import Decimal
from app.repositories.cart_repo import CartRepository
from app.repositories.product_repo import ProductRepository
from app.models.cart import Cart, CartStatus
from app.models.cart_item import CartItem
from app.core.exceptions import NotFoundException, BadRequestException, ConflictException

class CartService:
    def __init__(self, db: Session):
        self.db = db
        self.cart_repo = CartRepository(db)
        self.product_repo = ProductRepository(db)

    def get_cart_payload(self, user_id: UUID) -> Dict[str, Any]:
        cart = self.cart_repo.get_active_cart_for_user(user_id)
        
        items_payload = []
        total_quantity = 0
        subtotal = Decimal("0.00")
        
        for item in cart.items:
            item_subtotal = item.unit_price * item.quantity
            subtotal += item_subtotal
            total_quantity += item.quantity
            
            items_payload.append({
                "id": item.id,
                "product_id": item.product_id,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "subtotal": item_subtotal,
                "product": item.product
            })
            
        return {
            "id": cart.id,
            "user_id": cart.user_id,
            "status": cart.status,
            "items": items_payload,
            "total_quantity": total_quantity,
            "subtotal": subtotal,
            "updated_at": cart.updated_at
        }

    def add_item(self, user_id: UUID, product_id: UUID, quantity: int) -> Dict[str, Any]:
        if quantity <= 0:
            raise BadRequestException("Quantity must be at least 1.")
            
        product = self.product_repo.get_by_id(product_id)
        if not product or not product.is_active:
            raise BadRequestException("Product is unavailable or inactive.")
            
        cart = self.cart_repo.get_active_cart_for_user(user_id)
        existing_item = self.cart_repo.get_cart_item(cart.id, product_id)
        new_quantity = (existing_item.quantity + quantity) if existing_item else quantity
        
        if new_quantity > product.available_stock:
            raise ConflictException(
                f"Cannot add {quantity} more. Total requested ({new_quantity}) exceeds available stock ({product.available_stock})."
            )
            
        self.cart_repo.add_or_update_item(cart, product_id, quantity, product.price)
        self.db.commit()
        return self.get_cart_payload(user_id)

    def update_item_quantity(self, user_id: UUID, item_id: UUID, quantity: int) -> Dict[str, Any]:
        if quantity <= 0:
            raise BadRequestException("Quantity must be greater than 0.")
            
        cart = self.cart_repo.get_active_cart_for_user(user_id)
        item = self.cart_repo.get_cart_item_by_id(item_id)
        if not item or item.cart_id != cart.id:
            raise NotFoundException("Cart item not found.")
            
        product = self.product_repo.get_by_id(item.product_id)
        if not product or not product.is_active:
            raise BadRequestException("Product is inactive or unavailable.")
            
        if quantity > product.available_stock:
            raise ConflictException(
                f"Requested quantity ({quantity}) exceeds available stock ({product.available_stock})."
            )
            
        item.quantity = quantity
        item.unit_price = product.price
        self.db.commit()
        return self.get_cart_payload(user_id)

    def remove_item(self, user_id: UUID, item_id: UUID) -> Dict[str, Any]:
        cart = self.cart_repo.get_active_cart_for_user(user_id)
        item = self.cart_repo.get_cart_item_by_id(item_id)
        if not item or item.cart_id != cart.id:
            raise NotFoundException("Cart item not found.")
            
        self.cart_repo.remove_item(item)
        self.db.commit()
        return self.get_cart_payload(user_id)

    def clear_cart(self, user_id: UUID) -> Dict[str, Any]:
        cart = self.cart_repo.get_active_cart_for_user(user_id)
        self.cart_repo.clear_cart(cart.id)
        self.db.commit()
        return self.get_cart_payload(user_id)
