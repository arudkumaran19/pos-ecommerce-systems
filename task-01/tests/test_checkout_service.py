from app.db.session import SessionLocal
from app.models.product import Product
from app.models.cart import Cart
from app.models.cart_item import CartItem
from app.models.order import OrderStatus
from app.models.reservation import ReservationStatus
from app.services.checkout import CheckoutService
from app.models.payment import PaymentStatus
from app.services.payment import PaymentOutcome, PaymentService
from fastapi import HTTPException
from app.services.order import OrderService
import threading



def test_checkout_reserves_stock():
    db = SessionLocal()

    try:
        product = Product(
            name="Automated Checkout Test",
            price=25.00,
            available_stock=5,
        )
        db.add(product)
        db.flush()

        cart = Cart()
        db.add(cart)
        db.flush()

        cart_item = CartItem(
            cart_id=cart.id,
            product_id=product.id,
            quantity=2,
        )
        db.add(cart_item)
        db.commit()

        service = CheckoutService(db)
        result = service.checkout(cart.id)

        db.refresh(product)

        assert result.status == OrderStatus.RESERVED.value
        assert result.reservation is not None
        assert result.reservation.status == ReservationStatus.ACTIVE.value
        assert product.available_stock == 3

    finally:
        db.rollback()
        db.close()

def test_payment_success_marks_order_paid():
    db = SessionLocal()

    try:
        product = Product(
            name="Automated Payment Success Test",
            price=30.00,
            available_stock=5,
        )
        db.add(product)
        db.flush()

        cart = Cart()
        db.add(cart)
        db.flush()

        db.add(
            CartItem(
                cart_id=cart.id,
                product_id=product.id,
                quantity=1,
            )
        )
        db.commit()

        checkout_service = CheckoutService(db)
        order = checkout_service.checkout(cart.id)

        payment_service = PaymentService(db)
        payment = payment_service.process_payment(
            order_id=order.id,
            idempotency_key=f"success-test-{order.id}",
            outcome=PaymentOutcome.SUCCESS,
        )

        db.refresh(order)

        assert payment.status == PaymentStatus.SUCCEEDED.value
        assert order.status == OrderStatus.PAID.value

    finally:
        db.rollback()
        db.close()


def test_payment_failure_releases_stock():
    db = SessionLocal()

    try:
        product = Product(
            name="Automated Payment Failure Test",
            price=35.00,
            available_stock=5,
        )
        db.add(product)
        db.flush()

        cart = Cart()
        db.add(cart)
        db.flush()

        db.add(
            CartItem(
                cart_id=cart.id,
                product_id=product.id,
                quantity=2,
            )
        )
        db.commit()

        checkout_service = CheckoutService(db)
        order = checkout_service.checkout(cart.id)

        db.refresh(product)
        assert product.available_stock == 3

        payment_service = PaymentService(db)
        payment = payment_service.process_payment(
            order_id=order.id,
            idempotency_key=f"failure-test-{order.id}",
            outcome=PaymentOutcome.FAILURE,
        )

        db.refresh(product)
        db.refresh(order)

        assert payment.status == PaymentStatus.FAILED.value
        assert order.status == OrderStatus.FAILED.value
        assert product.available_stock == 5

    finally:
        db.rollback()
        db.close()


def test_payment_timeout_expires_order_and_releases_stock():
    db = SessionLocal()

    try:
        product = Product(
            name="Automated Payment Timeout Test",
            price=40.00,
            available_stock=5,
        )
        db.add(product)
        db.flush()

        cart = Cart()
        db.add(cart)
        db.flush()

        db.add(
            CartItem(
                cart_id=cart.id,
                product_id=product.id,
                quantity=1,
            )
        )
        db.commit()

        checkout_service = CheckoutService(db)
        order = checkout_service.checkout(cart.id)

        db.refresh(product)
        assert product.available_stock == 4

        payment_service = PaymentService(db)
        payment = payment_service.process_payment(
            order_id=order.id,
            idempotency_key=f"timeout-test-{order.id}",
            outcome=PaymentOutcome.TIMEOUT,
        )

        db.refresh(product)
        db.refresh(order)

        assert payment.status == PaymentStatus.TIMED_OUT.value
        assert order.status == OrderStatus.EXPIRED.value
        assert product.available_stock == 5

    finally:
        db.rollback()
        db.close()

def test_duplicate_payment_is_rejected():
    """
    Idempotency semantics:
    - Same key + same order  → returns the existing payment (no error)
    - Same key + diff order  → rejected with HTTP 422
    """
    db = SessionLocal()

    try:
        product = Product(
            name="Automated Duplicate Payment Test",
            price=45.00,
            available_stock=10,
        )
        db.add(product)
        db.flush()

        # Cart 1 → order 1
        cart1 = Cart()
        db.add(cart1)
        db.flush()
        db.add(CartItem(cart_id=cart1.id, product_id=product.id, quantity=1))

        # Cart 2 → order 2 (different order, same product)
        cart2 = Cart()
        db.add(cart2)
        db.flush()
        db.add(CartItem(cart_id=cart2.id, product_id=product.id, quantity=1))

        db.commit()

        checkout_service = CheckoutService(db)
        order1 = checkout_service.checkout(cart1.id)
        order2 = checkout_service.checkout(cart2.id)

        payment_service = PaymentService(db)

        idempotency_key = f"duplicate-payment-test-{order1.id}"

        # First payment succeeds normally.
        first_payment = payment_service.process_payment(
            order_id=order1.id,
            idempotency_key=idempotency_key,
            outcome=PaymentOutcome.SUCCESS,
        )

        assert first_payment.status == PaymentStatus.SUCCEEDED.value

        # Retry with the same key for the SAME order → idempotent return (no error).
        idempotent_payment = payment_service.process_payment(
            order_id=order1.id,
            idempotency_key=idempotency_key,
            outcome=PaymentOutcome.SUCCESS,
        )
        assert idempotent_payment.id == first_payment.id
        assert idempotent_payment.status == PaymentStatus.SUCCEEDED.value

        # Same key for a DIFFERENT order → must be rejected with 422.
        try:
            payment_service.process_payment(
                order_id=order2.id,
                idempotency_key=idempotency_key,
                outcome=PaymentOutcome.SUCCESS,
            )
            assert False, "Reusing key for different order should be rejected"
        except HTTPException as exc:
            assert exc.status_code == 422

    finally:
        db.rollback()
        db.close()


def test_duplicate_checkout_is_rejected():
    db = SessionLocal()

    try:
        product = Product(
            name="Automated Duplicate Checkout Test",
            price=55.00,
            available_stock=5,
        )
        db.add(product)
        db.flush()

        cart = Cart()
        db.add(cart)
        db.flush()

        db.add(
            CartItem(
                cart_id=cart.id,
                product_id=product.id,
                quantity=1,
            )
        )
        db.commit()

        checkout_service = CheckoutService(db)

        first_order = checkout_service.checkout(cart.id)

        assert first_order.status == OrderStatus.RESERVED.value

        try:
            checkout_service.checkout(cart.id)
            assert False, "Duplicate checkout should have been rejected"
        except HTTPException as exc:
            assert exc.status_code == 409

    finally:
        db.rollback()
        db.close()

def test_invalid_order_status_transition_is_rejected():
    db = SessionLocal()

    try:
        product = Product(
            name="Automated Status Transition Test",
            price=60.00,
            available_stock=5,
        )
        db.add(product)
        db.flush()

        cart = Cart()
        db.add(cart)
        db.flush()

        db.add(
            CartItem(
                cart_id=cart.id,
                product_id=product.id,
                quantity=1,
            )
        )
        db.commit()

        checkout_service = CheckoutService(db)
        order = checkout_service.checkout(cart.id)

        assert order.status == OrderStatus.RESERVED.value

        order_service = OrderService(db)

        try:
            order_service.transition_status(
                order,
                OrderStatus.FAILED.value,
            )

            # Reserved -> Failed is currently allowed.
            # Therefore this assertion intentionally checks
            # a transition that is definitely invalid.
            order_service.transition_status(
                order,
                OrderStatus.PENDING.value,
            )

            assert False, "Invalid transition should have been rejected"

        except HTTPException as exc:
            assert exc.status_code == 409

    finally:
        db.rollback()
        db.close()

def test_paid_order_cancellation_restores_stock():
    db = SessionLocal()

    try:
        product = Product(
            name="Automated Paid Cancellation Test",
            price=70.00,
            available_stock=5,
        )
        db.add(product)
        db.flush()

        cart = Cart()
        db.add(cart)
        db.flush()

        db.add(
            CartItem(
                cart_id=cart.id,
                product_id=product.id,
                quantity=2,
            )
        )
        db.commit()

        checkout_service = CheckoutService(db)
        order = checkout_service.checkout(cart.id)

        db.refresh(product)
        assert product.available_stock == 3

        payment_service = PaymentService(db)
        payment = payment_service.process_payment(
            order_id=order.id,
            idempotency_key=f"paid-cancel-test-{order.id}",
            outcome=PaymentOutcome.SUCCESS,
        )

        assert payment.status == PaymentStatus.SUCCEEDED.value

        order_service = OrderService(db)
        cancelled_order = order_service.cancel_order(order.id)

        db.refresh(product)

        assert cancelled_order.status == OrderStatus.CANCELLED.value
        assert cancelled_order.payment is not None
        assert cancelled_order.payment.status == PaymentStatus.REFUNDED.value
        assert product.available_stock == 5

    finally:
        db.rollback()
        db.close()

def test_concurrent_checkouts_do_not_oversell():
    setup_db = SessionLocal()

    try:
        product = Product(
            name="Automated Concurrency Test",
            price=80.00,
            available_stock=1,
        )
        setup_db.add(product)
        setup_db.flush()

        cart1 = Cart()
        cart2 = Cart()
        setup_db.add_all([cart1, cart2])
        setup_db.flush()

        setup_db.add_all(
            [
                CartItem(
                    cart_id=cart1.id,
                    product_id=product.id,
                    quantity=1,
                ),
                CartItem(
                    cart_id=cart2.id,
                    product_id=product.id,
                    quantity=1,
                ),
            ]
        )
        setup_db.commit()

        cart1_id = cart1.id
        cart2_id = cart2.id
        product_id = product.id

    finally:
        setup_db.close()

    barrier = threading.Barrier(2)
    results = []

    def run_checkout(cart_id):
        db = SessionLocal()

        try:
            barrier.wait()

            service = CheckoutService(db)
            order = service.checkout(cart_id)

            results.append(
                {
                    "success": True,
                    "order_id": order.id,
                    "cart_id": cart_id,
                }
            )

        except Exception as exc:
            db.rollback()
            results.append(
                {
                    "success": False,
                    "cart_id": cart_id,
                    "error": exc,
                }
            )

        finally:
            db.close()

    thread1 = threading.Thread(
        target=run_checkout,
        args=(cart1_id,),
    )
    thread2 = threading.Thread(
        target=run_checkout,
        args=(cart2_id,),
    )

    thread1.start()
    thread2.start()

    thread1.join()
    thread2.join()

    successful = [
        result
        for result in results
        if result["success"]
    ]

    failed = [
        result
        for result in results
        if not result["success"]
    ]

    assert len(results) == 2
    assert len(successful) == 1
    assert len(failed) == 1

    error = failed[0]["error"]

    assert isinstance(error, HTTPException)
    assert error.status_code == 409

    verify_db = SessionLocal()

    try:
        product = verify_db.get(Product, product_id)

        assert product is not None
        assert product.available_stock == 0

    finally:
        verify_db.close()

def test_inactive_product_rejected_and_product_name_snapshot():
    from app.services.cart import CartService

    db = SessionLocal()

    try:
        active_prod = Product(
            name="Active Snapshot Product",
            price=15.00,
            available_stock=10,
            is_active=True,
        )
        inactive_prod = Product(
            name="Inactive Product Test",
            price=20.00,
            available_stock=5,
            is_active=False,
        )
        db.add(active_prod)
        db.add(inactive_prod)
        db.flush()

        cart_service = CartService(db)
        cart = cart_service.create_cart()

        from app.schemas.cart import CartItemCreate

        # 1. Cart service must reject inactive product
        try:
            cart_service.add_item(
                cart.id,
                CartItemCreate(product_id=inactive_prod.id, quantity=1),
            )
            assert False, "Expected 400 for adding inactive product to cart"
        except HTTPException as exc:
            assert exc.status_code == 400
            assert "no longer active" in exc.detail.lower()

        # Add active product to cart
        cart_service.add_item(
            cart.id,
            CartItemCreate(product_id=active_prod.id, quantity=2),
        )
        db.commit()

        # 2. Checkout creates order with product_name snapshot
        checkout_service = CheckoutService(db)
        order = checkout_service.checkout(cart.id)

        assert len(order.items) == 1
        assert order.items[0].product_name == "Active Snapshot Product"
        assert order.items[0].quantity == 2

    finally:
        db.rollback()
        db.close()