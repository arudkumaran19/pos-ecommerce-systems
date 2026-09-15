import json
from typing import Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from uuid import UUID
from app.repositories.order_repo import OrderRepository
from app.repositories.reservation_repo import ReservationRepository
from app.repositories.payment_repo import PaymentRepository
from app.repositories.idempotency_repo import IdempotencyRepository
from app.repositories.product_repo import ProductRepository
from app.models.order import Order, OrderStatus
from app.models.reservation import ReservationStatus
from app.models.payment import Payment, PaymentStatus
from app.models.idempotency import IdempotencyRecord
from app.models.user import User
from app.schemas.payment import MockPaymentMode
from app.services.mock_gateway import MockPaymentGateway
from app.services.audit_service import AuditService
from app.core.security import compute_payload_hash
from app.core.exceptions import (
    NotFoundException,
    BadRequestException,
    ConflictException,
    IdempotencyConflictException,
    IdempotencyPayloadMismatchException
)

class PaymentService:
    def __init__(self, db: Session):
        self.db = db
        self.order_repo = OrderRepository(db)
        self.reservation_repo = ReservationRepository(db)
        self.payment_repo = PaymentRepository(db)
        self.idempotency_repo = IdempotencyRepository(db)
        self.product_repo = ProductRepository(db)
        self.audit_service = AuditService(db)

    def process_payment(
        self,
        user: User,
        order_id: UUID,
        idempotency_key: str,
        payment_mode: MockPaymentMode = MockPaymentMode.MOCK_SUCCESS,
        payment_method: str = "CARD",
        ip_address: str = None
    ) -> Dict[str, Any]:
        if not idempotency_key:
            raise BadRequestException("Idempotency-Key header is required.")
            
        endpoint = "/api/v1/payments"
        payload_repr = f"{order_id}:{payment_mode.value}:{payment_method}"
        req_hash = compute_payload_hash(payload_repr)
        
        # 1. Idempotency check
        existing_rec = self.idempotency_repo.get_by_key(idempotency_key)
        if existing_rec:
            if existing_rec.request_hash != req_hash:
                raise IdempotencyPayloadMismatchException(
                    "Idempotency key has already been used with a different request payload."
                )
            if existing_rec.status == "IN_PROGRESS":
                raise IdempotencyConflictException(
                    "Payment with this idempotency key is currently processing. Please wait."
                )
            if existing_rec.status == "COMPLETED" and existing_rec.response_body:
                # Return cached payment result
                return existing_rec.response_body

        # 2. Acquire in-progress lock in idempotency table
        idempotency_rec = IdempotencyRecord(
            key=idempotency_key,
            user_id=user.id,
            endpoint=endpoint,
            request_hash=req_hash,
            status="IN_PROGRESS",
            expires_at=datetime.now(timezone.utc) + timedelta(hours=24)
        )
        self.db.add(idempotency_rec)
        try:
            self.db.commit()
        except Exception:
            self.db.rollback()
            # Double check if concurrent insert occurred
            check_rec = self.idempotency_repo.get_by_key(idempotency_key)
            if check_rec and check_rec.status == "COMPLETED":
                return check_rec.response_body
            raise IdempotencyConflictException("Concurrent request in progress.")

        # 3. Lock order row, then validate ownership and status
        locked_order = self.order_repo.get_for_update(order_id)
        if not locked_order:
            idempotency_rec.status = "FAILED"
            self.db.commit()
            raise NotFoundException("Order not found.")

        order = self.order_repo.get_with_details(order_id)
        if not order or order.user_id != user.id:
            idempotency_rec.status = "FAILED"
            self.db.commit()
            raise NotFoundException("Order not found.")

        if order.status != OrderStatus.RESERVED:
            idempotency_rec.status = "FAILED"
            self.db.commit()
            raise ConflictException("This order can no longer be paid. Please start a new checkout.")

        # 4. Check if 5-minute reservation TTL has elapsed
        now_utc = datetime.now(timezone.utc)
        active_reservations = self.reservation_repo.get_active_by_order(order.id)
        if not active_reservations or any(r.expires_at <= now_utc for r in active_reservations):
            self._restore_active_reservations(
                active_reservations, now_utc, ReservationStatus.EXPIRED
            )
            order.status = OrderStatus.EXPIRED
            idempotency_rec.status = "FAILED"
            self.db.commit()
            raise ConflictException("Your payment window has expired. Please place a new order.")

        # 5. Execute Mock Payment Gateway
        payment_status, provider_ref, error_msg = MockPaymentGateway.process_payment(
            amount=order.total,
            mode=payment_mode
        )

        # 6. Apply state transitions atomically
        payment = Payment(
            order_id=order.id,
            idempotency_key=idempotency_key,
            status=payment_status,
            amount=order.total,
            provider="MOCK_GATEWAY",
            provider_reference=provider_ref,
            error_message=error_msg
        )
        self.payment_repo.add(payment)
        self.db.flush()

        if payment_status == PaymentStatus.SUCCEEDED:
            order.status = OrderStatus.PAID
            for r in active_reservations:
                r.status = ReservationStatus.CONSUMED
            audit_action = "PAYMENT_SUCCEEDED"

        elif payment_status == PaymentStatus.FAILED:
            order.status = OrderStatus.FAILED
            self._restore_active_reservations(
                active_reservations, now_utc, ReservationStatus.RELEASED
            )
            audit_action = "PAYMENT_FAILED"

        elif payment_status == PaymentStatus.TIMEOUT:
            if any(r.expires_at <= now_utc for r in active_reservations):
                order.status = OrderStatus.EXPIRED
                self._restore_active_reservations(
                    active_reservations, now_utc, ReservationStatus.EXPIRED
                )
            audit_action = "PAYMENT_TIMEOUT"

        response_data = {
            "id": str(payment.id),
            "order_id": str(order.id),
            "idempotency_key": idempotency_key,
            "status": payment.status.value,
            "order_status": order.status.value,
            "amount": str(payment.amount),
            "provider": payment.provider,
            "provider_reference": payment.provider_reference,
            "error_message": payment.error_message,
            "created_at": payment.created_at.isoformat() if payment.created_at else now_utc.isoformat(),
            "updated_at": payment.updated_at.isoformat() if payment.updated_at else now_utc.isoformat()
        }

        idempotency_rec.status = "COMPLETED"
        idempotency_rec.response_code = 200
        idempotency_rec.response_body = response_data

        self.audit_service.log(
            action=audit_action,
            entity_type="PAYMENT",
            entity_id=str(payment.id),
            actor_user_id=user.id,
            target_user_id=order.user_id,
            after_data={"payment_status": payment.status.value, "order_status": order.status.value},
            reason=error_msg,
            ip_address=ip_address
        )

        self.db.commit()
        self.db.refresh(payment)
        self.db.refresh(order)
        return response_data

    def _restore_active_reservations(self, reservations, now_utc, new_status: ReservationStatus):
        active = [r for r in reservations if r.status == ReservationStatus.ACTIVE]
        if not active:
            return
        product_ids = sorted({r.product_id for r in active})
        locked_products = {p.id: p for p in self.product_repo.get_for_update_multi(product_ids)}
        for r in active:
            r.status = new_status
            r.released_at = now_utc
            product = locked_products.get(r.product_id)
            if product:
                product.available_stock += r.quantity
