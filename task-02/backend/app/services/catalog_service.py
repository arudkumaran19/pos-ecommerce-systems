from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from uuid import UUID
from decimal import Decimal
import re
from app.repositories.product_repo import ProductRepository
from app.models.product import Product
from app.models.user import User
from app.core.exceptions import NotFoundException, ConflictException, BadRequestException
from app.services.audit_service import AuditService

def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return re.sub(r"^-+|-+$", "", text)

class CatalogService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = ProductRepository(db)
        self.audit_service = AuditService(db)

    def list_products(
        self,
        query: Optional[str] = None,
        category: Optional[str] = None,
        min_price: Optional[Decimal] = None,
        max_price: Optional[Decimal] = None,
        in_stock_only: bool = False,
        is_active: Optional[bool] = True,
        sort_by: str = "newest",
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[Product], int]:
        skip = (page - 1) * limit
        return self.repo.search_catalog(
            query=query,
            category=category,
            min_price=min_price,
            max_price=max_price,
            in_stock_only=in_stock_only,
            is_active=is_active,
            sort_by=sort_by,
            skip=skip,
            limit=limit
        )

    def get_product(self, product_id_or_slug: str) -> Product:
        try:
            val_uuid = UUID(product_id_or_slug)
            product = self.repo.get_by_id(val_uuid)
        except ValueError:
            product = self.repo.get_by_slug(product_id_or_slug)
            
        if not product:
            raise NotFoundException("Product not found.")
        return product

    # Admin Methods
    def create_product(
        self,
        actor: User,
        name: str,
        category: str,
        price: Decimal,
        available_stock: int,
        description: str = "",
        image_url: str = "",
        is_active: bool = True
    ) -> Product:
        slug = slugify(name)
        existing = self.repo.get_by_slug(slug)
        if existing:
            # Append suffix if needed
            slug = f"{slug}-{self.repo.count() + 1}"
            
        product = Product(
            name=name.strip(),
            slug=slug,
            description=description.strip(),
            category=category.strip(),
            price=price,
            available_stock=available_stock,
            image_url=image_url.strip(),
            is_active=is_active
        )
        self.repo.add(product)
        self.db.flush()
        self.audit_service.log(
            action="ADMIN_PRODUCT_CREATED",
            entity_type="PRODUCT",
            entity_id=str(product.id),
            actor_user_id=actor.id,
            after_data={"name": product.name, "price": str(product.price), "stock": product.available_stock}
        )
        self.db.commit()
        self.db.refresh(product)
        return product

    def update_product(
        self,
        actor: User,
        product_id: UUID,
        name: Optional[str] = None,
        category: Optional[str] = None,
        price: Optional[Decimal] = None,
        available_stock: Optional[int] = None,
        description: Optional[str] = None,
        image_url: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> Product:
        product = self.repo.get_by_id(product_id)
        if not product:
            raise NotFoundException("Product not found.")
            
        before = {
            "name": product.name,
            "price": str(product.price),
            "stock": product.available_stock,
            "is_active": product.is_active
        }
        
        if name is not None:
            product.name = name.strip()
        if category is not None:
            product.category = category.strip()
        if price is not None:
            product.price = price
        if available_stock is not None:
            product.available_stock = available_stock
        if description is not None:
            product.description = description.strip()
        if image_url is not None:
            product.image_url = image_url.strip()
        if is_active is not None:
            product.is_active = is_active
            
        after = {
            "name": product.name,
            "price": str(product.price),
            "stock": product.available_stock,
            "is_active": product.is_active
        }
        self.audit_service.log(
            action="ADMIN_PRODUCT_UPDATED",
            entity_type="PRODUCT",
            entity_id=str(product.id),
            actor_user_id=actor.id,
            before_data=before,
            after_data=after
        )
        self.db.commit()
        self.db.refresh(product)
        return product
