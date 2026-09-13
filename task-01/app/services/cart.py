from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.cart import CartRepository
from app.repositories.product import ProductRepository
from app.schemas.cart import CartItemCreate


class CartService:
    def __init__(self, db: Session):
        self.db = db
        self.cart_repository = CartRepository(db)
        self.product_repository = ProductRepository(db)

    def create_cart(self):
        cart = self.cart_repository.create()

        self.db.commit()
        self.db.refresh(cart)

        return cart

    def get_cart(self, cart_id: int):
        cart = self.cart_repository.get_by_id(cart_id)

        if cart is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cart not found",
            )

        return cart

    def add_item(
            self,
            cart_id: int,
            data: CartItemCreate,
    ):
        cart = self.get_cart(cart_id)

        if cart.status != "Active":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cart is not active",
            )

        product = self.product_repository.get_by_id(
            data.product_id,
        )

        if product is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found",
            )

        existing_item = self.cart_repository.get_item(
            cart_id=cart_id,
            product_id=data.product_id,
        )

        if existing_item is not None:
            new_quantity = existing_item.quantity + data.quantity

            if new_quantity > product.available_stock:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Insufficient stock",
                )

            existing_item.quantity = new_quantity
        else:
            if data.quantity > product.available_stock:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Insufficient stock",
                )

            self.cart_repository.add_item(
                cart_id=cart_id,
                product_id=data.product_id,
                quantity=data.quantity,
            )

        self.db.commit()

        return self.get_cart(cart_id)

    def update_item_quantity(
            self,
            cart_id: int,
            product_id: int,
            quantity: int,
    ):
        cart = self.get_cart(cart_id)

        if cart.status != "Active":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cart is not active",
            )

        product = self.product_repository.get_by_id(product_id)

        if product is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found",
            )

        item = self.cart_repository.get_item(
            cart_id=cart_id,
            product_id=product_id,
        )

        if item is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cart item not found",
            )

        if quantity > product.available_stock:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Insufficient stock",
            )

        item.quantity = quantity

        self.db.commit()

        return self.get_cart(cart_id)

    def remove_item(
            self,
            cart_id: int,
            product_id: int,
    ):
        cart = self.get_cart(cart_id)

        if cart.status != "Active":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cart is not active",
            )

        item = self.cart_repository.get_item(
            cart_id=cart_id,
            product_id=product_id,
        )

        if item is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cart item not found",
            )

        self.cart_repository.delete_item(item)

        self.db.commit()

        return self.get_cart(cart_id)