import asyncio
import os
from contextlib import asynccontextmanager
from decimal import Decimal
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.api.v1.router import api_v1_router
from app.services.sweeper_service import start_periodic_reservation_sweeper
from app.models.product import Product
from app.models.user import User, UserRole
from app.core.security import hash_password

def seed_demo_data():
    """Seed initial demo catalog and admin user if database is empty."""
    db = SessionLocal()
    try:
        # 1. Seed default admin if no users exist
        if db.query(User).count() == 0:
            admin_user = User(
                email="admin@techloom.com",
                full_name="TechLoom Admin",
                password_hash=hash_password("AdminSecurePass!2026"),
                role=UserRole.ADMIN,
                is_active=True
            )
            demo_customer = User(
                email="customer@techloom.com",
                full_name="Sarah Connor",
                password_hash=hash_password("CustomerPass123!"),
                role=UserRole.CUSTOMER,
                is_active=True
            )
            db.add(admin_user)
            db.add(demo_customer)
            db.commit()

        # 2. Seed products if catalog is empty
        if db.query(Product).count() == 0:
            sample_products = [
                Product(
                    name="Aura Pro Wireless Noise-Cancelling Headphones",
                    slug="aura-pro-wireless-headphones",
                    description="Studio-grade spatial audio, 40-hour battery life, hybrid active noise cancellation, and ultra-plush memory foam cushions.",
                    category="Audio",
                    price=Decimal("299.99"),
                    available_stock=25,
                    image_url="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
                    is_active=True
                ),
                Product(
                    name="Chronos Minimalist Chronograph Watch",
                    slug="chronos-minimalist-watch",
                    description="Surgical-grade 316L stainless steel case, sapphire crystal glass, Japanese quartz movement, and interchangeable genuine leather strap.",
                    category="Accessories",
                    price=Decimal("185.00"),
                    available_stock=18,
                    image_url="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80",
                    is_active=True
                ),
                Product(
                    name="Lumina Ergonomic Mechanical Keyboard",
                    slug="lumina-ergonomic-keyboard",
                    description="Custom hot-swappable lubricated linear switches, CNC anodized aluminum chassis, PBT double-shot keycaps, and per-key RGB backlighting.",
                    category="Electronics",
                    price=Decimal("165.50"),
                    available_stock=12,
                    image_url="https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80",
                    is_active=True
                ),
                Product(
                    name="Veloce Ultra-Lightweight Running Sneakers",
                    slug="veloce-running-sneakers",
                    description="Carbon-fiber infused propulsion plate, breathable engineered mesh upper, responsive nitrogen-infused foam midsole, and Continental rubber grip.",
                    category="Apparel",
                    price=Decimal("140.00"),
                    available_stock=30,
                    image_url="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80",
                    is_active=True
                ),
                Product(
                    name="Vantage 4K HDR Smart Action Camera",
                    slug="vantage-4k-action-camera",
                    description="RockSteady 6-axis optical stabilization, 4K@120fps video recording, dual OLED touchscreens, and waterproof up to 16 meters without a housing.",
                    category="Electronics",
                    price=Decimal("349.00"),
                    available_stock=8,
                    image_url="https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&auto=format&fit=crop&q=80",
                    is_active=True
                ),
                Product(
                    name="Nomad Weatherproof Canvas Backpack 28L",
                    slug="nomad-weatherproof-backpack-28l",
                    description="Ballistic recycled nylon with TPU weather-coating, magnetic Fidlock buckles, dedicated padded 16-inch laptop compartment, and luggage pass-through.",
                    category="Accessories",
                    price=Decimal("119.95"),
                    available_stock=40,
                    image_url="https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80",
                    is_active=True
                ),
                Product(
                    name="Solstice Pure Ceramic Pour-Over Set",
                    slug="solstice-ceramic-pour-over-set",
                    description="Hand-glazed artisan matte ceramic dripper, heat-resistant borosilicate glass carafe with walnut collar, and precision gooseneck flow guides.",
                    category="Home & Living",
                    price=Decimal("68.00"),
                    available_stock=15,
                    image_url="https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=800&auto=format&fit=crop&q=80",
                    is_active=True
                ),
                Product(
                    name="Apex Carbon Fiber Road Helmet",
                    slug="apex-carbon-fiber-road-helmet",
                    description="Wind-tunnel tested aerodynamic profile, integrated MIPS rotational impact protection system, 18 channeled airflow vents, and lightweight magnetic chin buckle.",
                    category="Sports",
                    price=Decimal("210.00"),
                    available_stock=10,
                    image_url="https://images.unsplash.com/photo-1559348349-86f1f65817fe?w=800&auto=format&fit=crop&q=80",
                    is_active=True
                )
            ]
            db.add_all(sample_products)
            db.commit()
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables exist and seed demo catalog
    Base.metadata.create_all(bind=engine)
    seed_demo_data()
    
    # Ensure avatar directory exists
    os.makedirs(settings.MEDIA_DIR, exist_ok=True)
    
    # Launch background periodic sweeper for 5-min reservation expiry
    sweeper_task = asyncio.create_task(start_periodic_reservation_sweeper())
    
    yield
    
    # Shutdown: Cancel background tasks
    sweeper_task.cancel()
    try:
        await sweeper_task
    except asyncio.CancelledError:
        pass

app = FastAPI(
    title="TechLoom Storefront API",
    description="Customer E-Commerce Storefront, Inventory Reservation & Payment Reliability System",
    version="2.3.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-CSRF-Token"]
)

# Static media route for user avatars
os.makedirs(settings.MEDIA_DIR, exist_ok=True)
app.mount("/media/avatars", StaticFiles(directory=settings.MEDIA_DIR), name="avatars")

# Mount API Routers
app.include_router(api_v1_router)

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    if isinstance(exc, (StarletteHTTPException, RequestValidationError)):
        raise exc
    return JSONResponse(
        status_code=500,
        content={"detail": {"message": "Something went wrong. Please try again.", "code": "INTERNAL_ERROR"}},
    )

@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "techloom-storefront-api",
        "version": "2.3.0",
        "reservation_ttl_seconds": settings.RESERVATION_TTL_SECONDS
    }
