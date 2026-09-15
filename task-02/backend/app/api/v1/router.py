from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.profile import router as profile_router
from app.api.v1.products import router as products_router
from app.api.v1.cart import router as cart_router
from app.api.v1.checkout import router as checkout_router
from app.api.v1.payments import router as payments_router
from app.api.v1.orders import router as orders_router
from app.api.v1.admin.stats import router as admin_stats_router
from app.api.v1.admin.users import router as admin_users_router
from app.api.v1.admin.products import router as admin_products_router
from app.api.v1.admin.orders import router as admin_orders_router
from app.api.v1.admin.audit_logs import router as admin_audit_router

api_v1_router = APIRouter(prefix="/api/v1")

# Customer / Public Storefront Routers
api_v1_router.include_router(auth_router)
api_v1_router.include_router(profile_router)
api_v1_router.include_router(products_router)
api_v1_router.include_router(cart_router)
api_v1_router.include_router(checkout_router)
api_v1_router.include_router(payments_router)
api_v1_router.include_router(orders_router)

# Admin Sub-router
admin_router = APIRouter(prefix="/admin")
admin_router.include_router(admin_stats_router)
admin_router.include_router(admin_users_router)
admin_router.include_router(admin_products_router)
admin_router.include_router(admin_orders_router)
admin_router.include_router(admin_audit_router)

api_v1_router.include_router(admin_router)
