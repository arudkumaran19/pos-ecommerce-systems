import uuid
from decimal import Decimal
from fastapi.testclient import TestClient
from app.core.database import SessionLocal
from app.models.product import Product

def setup_user_and_reserved_order(client: TestClient):
    email = f"payer_{uuid.uuid4().hex[:8]}@example.com"
    reg = client.post("/api/v1/auth/register", json={
        "email": email,
        "full_name": "Payer Test",
        "password": "Password123!"
    })
    csrf = reg.json()["csrf_token"]
    
    # Add product and checkout
    product = client.get("/api/v1/products").json()["items"][0]
    client.post(
        "/api/v1/cart/items",
        json={"product_id": product["id"], "quantity": 1},
        headers={"X-CSRF-Token": csrf}
    )
    order_res = client.post(
        "/api/v1/checkout",
        json={"shipping_address": {"city": "Paris"}},
        headers={"X-CSRF-Token": csrf}
    )
    order_id = order_res.json()["id"]
    return csrf, order_id, product["id"]

def test_mock_payment_success_and_idempotency(client: TestClient):
    csrf, order_id, product_id = setup_user_and_reserved_order(client)
    idempotency_key = f"key_{uuid.uuid4().hex}"
    
    # 1. First payment submission
    pay_res = client.post(
        "/api/v1/payments",
        json={
            "order_id": order_id,
            "payment_mode": "MOCK_SUCCESS",
            "payment_method": "CARD"
        },
        headers={"X-CSRF-Token": csrf, "Idempotency-Key": idempotency_key}
    )
    assert pay_res.status_code == 200
    data = pay_res.json()
    assert data["status"] == "SUCCEEDED"
    assert data["order_status"] == "PAID"
    
    # 2. Duplicate submission with SAME idempotency key
    dup_res = client.post(
        "/api/v1/payments",
        json={
            "order_id": order_id,
            "payment_mode": "MOCK_SUCCESS",
            "payment_method": "CARD"
        },
        headers={"X-CSRF-Token": csrf, "Idempotency-Key": idempotency_key}
    )
    assert dup_res.status_code == 200
    # Must return exact same cached payload
    assert dup_res.json()["id"] == data["id"]
    assert dup_res.json()["status"] == "SUCCEEDED"

def test_idempotency_payload_mismatch(client: TestClient):
    csrf, order_id, product_id = setup_user_and_reserved_order(client)
    idempotency_key = f"key_{uuid.uuid4().hex}"
    
    # Submit first payment
    client.post(
        "/api/v1/payments",
        json={
            "order_id": order_id,
            "payment_mode": "MOCK_SUCCESS",
            "payment_method": "CARD"
        },
        headers={"X-CSRF-Token": csrf, "Idempotency-Key": idempotency_key}
    )
    
    # Submit second payment with same key but DIFFERENT mode
    mismatch_res = client.post(
        "/api/v1/payments",
        json={
            "order_id": order_id,
            "payment_mode": "MOCK_FAILURE",
            "payment_method": "CARD"
        },
        headers={"X-CSRF-Token": csrf, "Idempotency-Key": idempotency_key}
    )
    assert mismatch_res.status_code == 422

def test_mock_payment_failure_restores_stock(client: TestClient):
    db = SessionLocal()
    prod = Product(
        name=f"Stock Check Prod {uuid.uuid4().hex[:6]}",
        slug=f"stock-check-{uuid.uuid4().hex[:6]}",
        category="Test",
        price=Decimal("50.00"),
        available_stock=5,
        is_active=True
    )
    db.add(prod)
    db.commit()
    prod_id = str(prod.id)
    db.close()
    
    # Register & Checkout 2 items
    email = f"fail_payer_{uuid.uuid4().hex[:8]}@example.com"
    reg = client.post("/api/v1/auth/register", json={
        "email": email,
        "full_name": "Fail Payer",
        "password": "Password123!"
    })
    csrf = reg.json()["csrf_token"]
    
    client.post(
        "/api/v1/cart/items",
        json={"product_id": prod_id, "quantity": 2},
        headers={"X-CSRF-Token": csrf}
    )
    order_res = client.post(
        "/api/v1/checkout",
        json={"shipping_address": {"city": "Berlin"}},
        headers={"X-CSRF-Token": csrf}
    )
    order_id = order_res.json()["id"]
    
    # Available stock should now be 3
    db = SessionLocal()
    assert db.query(Product).filter(Product.id == prod_id).first().available_stock == 3
    db.close()
    
    # Execute MOCK_FAILURE
    pay_res = client.post(
        "/api/v1/payments",
        json={
            "order_id": order_id,
            "payment_mode": "MOCK_FAILURE",
            "payment_method": "CARD"
        },
        headers={"X-CSRF-Token": csrf, "Idempotency-Key": f"key_{uuid.uuid4().hex}"}
    )
    assert pay_res.status_code == 200
    assert pay_res.json()["status"] == "FAILED"
    assert pay_res.json()["order_status"] == "FAILED"
    
    # Stock must be restored to 5!
    db = SessionLocal()
    assert db.query(Product).filter(Product.id == prod_id).first().available_stock == 5
    db.close()
