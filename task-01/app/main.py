import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models
from app.api.carts import router as carts_router
from app.api.orders import router as orders_router
from app.api.payments import router as payments_router
from app.api.products import router as products_router
from app.db.session import SessionLocal
from app.services.expiry import ReservationExpiryService


async def reservation_expiry_worker():
    while True:
        try:
            db = SessionLocal()

            try:
                service = ReservationExpiryService(db)
                expired_count = service.expire_due_reservations()

                if expired_count > 0:
                    print(
                        f"Expired {expired_count} reservation(s)"
                    )
            finally:
                db.close()

        except Exception as exc:
            print(
                f"Reservation expiry worker error: {exc}"
            )

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products_router)
app.include_router(carts_router)
app.include_router(payments_router)
app.include_router(orders_router)


@app.get("/health")
def health_check():
    return {"status": "ok"}