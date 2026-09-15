from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from decimal import Decimal
from app.core.database import get_db
from app.schemas.product import ProductResponse
from app.schemas.common import PaginatedResponse
from app.services.catalog_service import CatalogService

router = APIRouter(prefix="/products", tags=["Product Catalog"])

@router.get("", response_model=PaginatedResponse[ProductResponse])
def list_products(
    q: Optional[str] = Query(None, description="Search term for name or description"),
    category: Optional[str] = Query(None, description="Filter by category"),
    min_price: Optional[Decimal] = Query(None, ge=0, description="Minimum price"),
    max_price: Optional[Decimal] = Query(None, ge=0, description="Maximum price"),
    in_stock_only: bool = Query(False, description="Filter only in-stock products"),
    sort: str = Query("newest", pattern="^(newest|price_asc|price_desc)$"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    svc = CatalogService(db)
    items, total = svc.list_products(
        query=q,
        category=category,
        min_price=min_price,
        max_price=max_price,
        in_stock_only=in_stock_only,
        sort_by=sort,
        page=page,
        limit=limit
    )
    total_pages = (total + limit - 1) // limit if total > 0 else 1
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages
    )

@router.get("/{id_or_slug}", response_model=ProductResponse)
def get_product(
    id_or_slug: str,
    db: Session = Depends(get_db)
):
    svc = CatalogService(db)
    return svc.get_product(id_or_slug)
