import uuid
import threading
from decimal import Decimal
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.product import Product
from app.models.user import User, UserRole
from app.core.security import hash_password

def test_concurrent_checkout_prevents_overselling():
    """
    Spawns 5 concurrent threads competing to purchase the remaining 2 units
    of a scarce product. Validates that PostgreSQL row-level locks prevent
    overselling: exactly 1-2 checkouts succeed, remaining fail with 409,
    and stock never drops below 0.
    """
    db = SessionLocal()
    # 1. Create scarce product with available_stock = 2
    scarce_product = Product(
        name=f"Scarce Item {uuid.uuid4().hex[:6]}",
        slug=f"scarce-item-{uuid.uuid4().hex[:6]}",
        description="Only 2 available",
        category="Limited",
        price=Decimal("99.00"),
        available_stock=2,
        is_active=True
    )
    db.add(scarce_product)
    
    # 2. Create 5 distinct customer accounts
    users = []
    for i in range(5):
        user = User(
            email=f"concurrent_buyer_{i}_{uuid.uuid4().hex[:6]}@example.com",
            full_name=f"Buyer {i}",
            password_hash=hash_password("Password123!"),
            role=UserRole.CUSTOMER,
            is_active=True
        )
        db.add(user)
        users.append(user)
    db.commit()
    user_emails = [u.email for u in users]
    db.refresh(scarce_product)
    product_id = scarce_product.id
    db.close()

    results = []

    def attempt_checkout(user_email: str):
        with TestClient(app) as client:
            # Login
            login_res = client.post("/api/v1/auth/login", json={
                "email": user_email,
                "password": "Password123!"
            })
            csrf = login_res.json()["csrf_token"]
            
            # Add 1 unit to cart
            add_res = client.post(
                "/api/v1/cart/items",
                json={"product_id": str(product_id), "quantity": 1},
                headers={"X-CSRF-Token": csrf}
            )
            if add_res.status_code != 200:
                results.append((user_email, add_res.status_code, "cart_failed"))
                return
                
            # Attempt checkout
            checkout_res = client.post(
                "/api/v1/checkout",
                json={"shipping_address": {"city": "London"}},
                headers={"X-CSRF-Token": csrf}
            )
            results.append((user_email, checkout_res.status_code, checkout_res.text))

    # Run 5 threads concurrently
    threads = [threading.Thread(target=attempt_checkout, args=(email,)) for email in user_emails]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    # Verify results
    success_count = sum(1 for _, code, _ in results if code == 200)
    conflict_count = sum(1 for _, code, _ in results if code in (409, 400))
    
    assert success_count == 2, f"Expected exactly 2 checkouts to succeed, got {success_count}. Results: {results}"
    assert conflict_count == 3, f"Expected 3 checkouts to be rejected with conflict, got {conflict_count}"
    
    # Check final stock in DB
    db_verify = SessionLocal()
    final_prod = db_verify.query(Product).filter(Product.id == product_id).first()
    assert final_prod.available_stock == 0, f"Expected remaining stock to be 0, got {final_prod.available_stock}"
    db_verify.close()
