import asyncio
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models
from app.api.auth import router as auth_router
from app.api.carts import router as carts_router
from app.api.orders import router as orders_router
from app.api.payments import router as payments_router
from app.api.products import router as products_router
from app.api.users import router as users_router
from app.db.session import SessionLocal
from app.services.expiry import ReservationExpiryService


async def reservation_expiry_worker():
    while True:
        db = None

        try:
            db = SessionLocal()

            service = ReservationExpiryService(db)
            expired_count = await asyncio.to_thread(
                service.expire_due_reservations
            )

            if expired_count > 0:
                print(
                    f"Expired {expired_count} reservation(s)"
                )

        except Exception as exc:
            print(
                f"Reservation expiry worker error: {exc}"
            )

        finally:
            if db is not None:
                db.close()

        await asyncio.sleep(5)


@asynccontextmanager
async def lifespan(app: FastAPI):
    worker = asyncio.create_task(
        reservation_expiry_worker()
    )

    yield

    worker.cancel()

    try:
        await worker
    except asyncio.CancelledError:
        pass

app = FastAPI(
    title="Techloom POS API",
    version="0.1.0",
    lifespan=lifespan,
)


frontend_url_env = os.getenv(
    "FRONTEND_URL",
    "http://localhost:5173",
)
frontend_origins = [url.strip() for url in frontend_url_env.split(",") if url.strip()]
frontend_origins.extend(["http://localhost:5173", "http://127.0.0.1:5173"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(set(frontend_origins)),
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(users_router)
app.include_router(products_router)
app.include_router(carts_router)
app.include_router(payments_router)
app.include_router(orders_router)


@app.get("/health")
def health_check():
    return {"status": "ok"}