import uuid
from decimal import Decimal
from fastapi.testclient import TestClient
from app.core.database import SessionLocal
from app.models.product import Product

def test_cancel_reserved_order_restores_stock(client: TestClient):
    db = SessionLocal()
    prod = Product(
        name=f"Cancel Test {uuid.uuid4().hex[:6]}",
        slug=f"cancel-test-{uuid.uuid4().hex[:6]}",
        category="Test",
        price=Decimal("40.00"),
        available_stock=4,
        is_active=True
    )
    db.add(prod)
    db.commit()
    prod_id = str(prod.id)
    db.close()
    
    # Register & Checkout 2 items
    email = f"canceller_{uuid.uuid4().hex[:8]}@example.com"
    reg = client.post("/api/v1/auth/register", json={
        "email": email,
        "full_name": "Cancel User",
        "password": "Password123!"
    })
    csrf = reg.json()["csrf_token"]
    
    client.post(
        "/api/v1/cart/items",
        json={"product_id": prod_id, "quantity": 2},
        headers={"X-CSRF-Token": csrf}
    )
    order = client.post(
        "/api/v1/checkout",
        json={"shipping_address": {"city": "Rome"}},
        headers={"X-CSRF-Token": csrf}
    ).json()
    order_id = order["id"]
    
    # Stock decreased to 2
    db = SessionLocal()
    assert db.query(Product).filter(Product.id == prod_id).first().available_stock == 2
    db.close()
    
    # Cancel order
    cancel_res = client.post(
        f"/api/v1/orders/{order_id}/cancel",
        headers={"X-CSRF-Token": csrf}
    )
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "CANCELLED"
    
    # Stock restored back to 4
    db = SessionLocal()
    assert db.query(Product).filter(Product.id == prod_id).first().available_stock == 4
    db.close()

def test_cancel_paid_order_simulates_refund(client: TestClient):
    db = SessionLocal()
    prod = Product(
        name=f"Refund Test {uuid.uuid4().hex[:6]}",
        slug=f"refund-test-{uuid.uuid4().hex[:6]}",
        category="Test",
        price=Decimal("80.00"),
        available_stock=3,
        is_active=True
    )
    db.add(prod)
    db.commit()
    prod_id = str(prod.id)
    db.close()
    
    # Register, checkout, and pay
    email = f"refunder_{uuid.uuid4().hex[:8]}@example.com"
    reg = client.post("/api/v1/auth/register", json={
        "email": email,
        "full_name": "Refund User",
        "password": "Password123!"
    })
    csrf = reg.json()["csrf_token"]
    
    client.post(
        "/api/v1/cart/items",
        json={"product_id": prod_id, "quantity": 1},
        headers={"X-CSRF-Token": csrf}
    )
    order = client.post(
        "/api/v1/checkout",
        json={"shipping_address": {"city": "Madrid"}},
        headers={"X-CSRF-Token": csrf}
    ).json()
    order_id = order["id"]
    
    # Pay
    client.post(
        "/api/v1/payments",
        json={
            "order_id": order_id,
            "payment_mode": "MOCK_SUCCESS",
            "payment_method": "CARD"
        },
        headers={"X-CSRF-Token": csrf, "Idempotency-Key": f"key_{uuid.uuid4().hex}"}
    )
    
    # Stock is 2
    db = SessionLocal()
    assert db.query(Product).filter(Product.id == prod_id).first().available_stock == 2
    db.close()
    
    # Cancel paid order -> Triggers refund
    cancel_res = client.post(
        f"/api/v1/orders/{order_id}/cancel",
        headers={"X-CSRF-Token": csrf}
    )
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "CANCELLED"
    
    # Stock restored back to 3
    db = SessionLocal()
    assert db.query(Product).filter(Product.id == prod_id).first().available_stock == 3
    db.close()
