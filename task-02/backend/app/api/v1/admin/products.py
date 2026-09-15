from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional
from app.core.database import get_db
from app.schemas.product import ProductResponse, ProductCreateRequest, ProductUpdateRequest
from app.schemas.common import PaginatedResponse
from app.models.user import User
from app.services.catalog_service import CatalogService
from app.api.deps import require_admin, verify_csrf

router = APIRouter(prefix="/products", tags=["Admin Product Management"], dependencies=[Depends(require_admin), Depends(verify_csrf)])

@router.get("", response_model=PaginatedResponse[ProductResponse])
def list_admin_products(
    query: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    svc = CatalogService(db)
    items, total = svc.list_products(
        query=query,
        category=category,
        is_active=None,
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

@router.post("", response_model=ProductResponse)
def create_product(
    data: ProductCreateRequest,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    svc = CatalogService(db)
    return svc.create_product(
        actor=current_admin,
        name=data.name,
        category=data.category,
        price=data.price,
        available_stock=data.available_stock,
        description=data.description,
        image_url=data.image_url,
        is_active=data.is_active
    )

@router.patch("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: UUID,
    data: ProductUpdateRequest,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    svc = CatalogService(db)
    return svc.update_product(
        actor=current_admin,
        product_id=product_id,
        name=data.name,
        category=data.category,
        price=data.price,
        available_stock=data.available_stock,
        description=data.description,
        image_url=data.image_url,
        is_active=data.is_active
    )
