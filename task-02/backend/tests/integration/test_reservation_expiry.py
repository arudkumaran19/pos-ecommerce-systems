import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from fastapi.testclient import TestClient
from app.core.database import SessionLocal
from app.models.product import Product
from app.models.reservation import Reservation, ReservationStatus
from app.models.order import Order, OrderStatus
from app.services.sweeper_service import sweep_expired_reservations_once

def test_reservation_sweeper_restores_stock(client: TestClient):
    db = SessionLocal()
    prod = Product(
        name=f"Sweeper Product {uuid.uuid4().hex[:6]}",
        slug=f"sweeper-prod-{uuid.uuid4().hex[:6]}",
        category="Test",
        price=Decimal("25.00"),
        available_stock=5,
        is_active=True
    )
    db.add(prod)
    db.commit()
    prod_id = str(prod.id)
    
    # Register customer & checkout 2 units
    email = f"sweeper_tester_{uuid.uuid4().hex[:8]}@example.com"
    reg = client.post("/api/v1/auth/register", json={
        "email": email,
        "full_name": "Sweeper Tester",
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
        json={"shipping_address": {"city": "Tokyo"}},
        headers={"X-CSRF-Token": csrf}
    )
    order_id = order_res.json()["id"]
    
    # Stock is now 3
    db.refresh(prod)
    assert prod.available_stock == 3
    
    # Simulate time travel: Move reservation expires_at to 10 seconds in the past
    db.query(Reservation).filter(Reservation.order_id == order_id).update({
        Reservation.expires_at: datetime.now(timezone.utc) - timedelta(seconds=10)
    })
    db.commit()
    
    # Execute single sweep pass
    swept_count = sweep_expired_reservations_once(db)
    assert swept_count >= 1
    
    # Verify stock restored back to 5
    db.refresh(prod)
    assert prod.available_stock == 5
    
    # Verify order is now EXPIRED
    order = db.query(Order).filter(Order.id == order_id).first()
    assert order.status == OrderStatus.EXPIRED
    db.close()
