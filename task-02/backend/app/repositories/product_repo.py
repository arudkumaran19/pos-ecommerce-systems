from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from uuid import UUID
from decimal import Decimal
from app.models.product import Product
from app.repositories.base import BaseRepository

class ProductRepository(BaseRepository[Product]):
    def __init__(self, db: Session):
        super().__init__(Product, db)

    def get_by_slug(self, slug: str) -> Optional[Product]:
        return self.db.query(Product).filter(Product.slug == slug).first()

    def get_for_update_multi(self, product_ids: List[UUID]) -> List[Product]:
        """
        Acquire PostgreSQL FOR UPDATE row locks in deterministic ascending UUID order
        to eliminate deadlock hazards during concurrent checkout.
        """
        if not product_ids:
            return []
        
        sorted_ids = sorted(product_ids)
        return (
            self.db.query(Product)
            .filter(Product.id.in_(sorted_ids))
            .order_by(Product.id.asc())
            .with_for_update()
            .populate_existing()
            .all()
        )

    def search_catalog(
        self,
        query: Optional[str] = None,
        category: Optional[str] = None,
        min_price: Optional[Decimal] = None,
        max_price: Optional[Decimal] = None,
        in_stock_only: bool = False,
        is_active: Optional[bool] = True,
        sort_by: str = "newest",
        skip: int = 0,
        limit: int = 20
    ) -> Tuple[List[Product], int]:
        q = self.db.query(Product)
        
        if is_active is not None:
            q = q.filter(Product.is_active == is_active)
            
        if query:
            pattern = f"%{query}%"
            q = q.filter(or_(Product.name.ilike(pattern), Product.description.ilike(pattern)))
            
        if category:
            q = q.filter(Product.category.ilike(category))
            
        if min_price is not None:
            q = q.filter(Product.price >= min_price)
            
        if max_price is not None:
            q = q.filter(Product.price <= max_price)
            
        if in_stock_only:
            q = q.filter(Product.available_stock > 0)
            
        # Sorting
        if sort_by == "price_asc":
            q = q.order_by(asc(Product.price))
        elif sort_by == "price_desc":
            q = q.order_by(desc(Product.price))
        else:
            q = q.order_by(desc(Product.created_at))
            
        total = q.count()
        products = q.offset(skip).limit(limit).all()
        return products, total
