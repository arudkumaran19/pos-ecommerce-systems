from datetime import datetime, timezone
from enum import Enum

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.order import Order, OrderStatus
from app.models.payment import PaymentStatus
from app.models.reservation import ReservationStatus
from app.repositories.payment import PaymentRepository
from app.services.reservation import ReservationService


class PaymentOutcome(str, Enum):
    SUCCESS = "success"
    FAILURE = "failure"
    TIMEOUT = "timeout"


class PaymentService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = PaymentRepository(db)

    def process_payment(
            self,
            order_id: int,
            idempotency_key: str,
            outcome: PaymentOutcome,
    ):
        order = self.db.scalars(
            select(Order)
            .where(Order.id == order_id)
            .with_for_update()
            .options(
                selectinload(Order.reservation),
                selectinload(Order.payment),
            )
        ).first()

        if order is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found",
            )

        # --- Idempotency check ---
        existing_payment = self.repository.get_by_idempotency_key(
            idempotency_key,
        )

        if existing_payment is not None:
            # Same key, same order → idempotent success: return existing payment.
            if existing_payment.order_id == order_id:
                return existing_payment
            # Same key, different order → reject with 422 (client bug).
            raise HTTPException(
                status_code=getattr(
                    status,
                    "HTTP_422_UNPROCESSABLE_CONTENT",
                    422,
                ),
                detail="Idempotency key is already used for a different order",
            )

        # --- Existing payment for this order (different key) ---
        existing_order_payment = self.repository.get_by_order_id(
            order.id,
        )

        if existing_order_payment is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Payment already exists for this order",
            )

        if order.status != OrderStatus.RESERVED.value:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Order is not awaiting payment",
            )

        reservation = order.reservation

        if reservation is None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Order has no reservation",
            )

        # Handle an expired reservation even if the background
        # expiry worker has not processed it yet.
        # Use timezone-aware UTC for comparison (TIMESTAMPTZ columns).
        now = datetime.now(timezone.utc)

        if reservation.expires_at <= now:
            reservation_service = ReservationService(self.db)

            reservation_service.release_reservation(
                order_id=order.id,
                expired=True,
            )

            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Reservation has expired",
            )

        if reservation.status != ReservationStatus.ACTIVE.value:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Reservation is no longer active",
            )

        payment = self.repository.create(
            order_id=order.id,
            idempotency_key=idempotency_key,
        )

        finalized_at = datetime.now(timezone.utc)

        if outcome == PaymentOutcome.SUCCESS:
            payment.status = PaymentStatus.SUCCEEDED.value
            payment.processed_at = finalized_at
            order.status = OrderStatus.PAID.value
            order.completed_at = finalized_at
            reservation.status = ReservationStatus.CONSUMED.value

            self.db.commit()
            self.db.refresh(payment)

            return payment

        if outcome == PaymentOutcome.FAILURE:
            payment.status = PaymentStatus.FAILED.value
            payment.processed_at = finalized_at
            order.completed_at = finalized_at

        elif outcome == PaymentOutcome.TIMEOUT:
            payment.status = PaymentStatus.TIMED_OUT.value
            payment.processed_at = finalized_at
            order.completed_at = finalized_at

        else:
            self.db.rollback()

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid payment outcome",
            )

        self.db.flush()

        reservation_service = ReservationService(self.db)

        reservation_service.release_reservation(
            order_id=order.id,
            expired=(outcome == PaymentOutcome.TIMEOUT),
        )

        self.db.refresh(payment)

        return payment