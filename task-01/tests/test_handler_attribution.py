"""
Tests for order handler (user) attribution.

Contracts verified:
  1. Authenticated checkout -> order.user_id == creator's ID (DB level).
  2. GET /orders returns handled_by with the correct operator info.
  3. A *different* user viewing the order still sees the original handler.
  4. A legacy order with NULL user_id returns handled_by=null, never the viewer.
"""
from fastapi.testclient import TestClient

from app.core.security import SESSION_COOKIE_NAME
from app.db.session import SessionLocal
from app.main import app
from app.models.order import Order
from tests.test_api_auth import get_or_create_test_users

client = TestClient(app)

MANAGER_EMAIL = "test_manager@techloom.com"
MANAGER_PASS = "ManagerPass123!"
CASHIER_EMAIL = "test_cashier@techloom.com"
CASHIER_PASS = "CashierPass123!"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_client(email: str, password: str) -> tuple[TestClient, int]:
    """Log in and return an isolated TestClient with active session and the user id."""
    user_client = TestClient(app)
    res = user_client.post("/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    return user_client, res.json()["user"]["id"]


def _create_product(user_client: TestClient, name: str = "Handler Test Widget", price: float = 5.00, stock: int = 20) -> int:
    res = user_client.post(
        "/products",
        json={"name": name, "price": price, "available_stock": stock},
    )
    assert res.status_code == 201, res.text
    return res.json()["id"]


def _checkout_as(user_client: TestClient, product_id: int, quantity: int = 1) -> dict:
    """Create cart, add item, checkout. Returns the checkout JSON body."""
    cart_res = user_client.post("/carts", json={})
    assert cart_res.status_code == 201, cart_res.text
    cart_id = cart_res.json()["id"]

    add_res = user_client.post(
        f"/carts/{cart_id}/items",
        json={"product_id": product_id, "quantity": quantity},
    )
    assert add_res.status_code == 200, add_res.text

    checkout_res = user_client.post(f"/carts/{cart_id}/checkout")
    assert checkout_res.status_code == 200, checkout_res.text
    return checkout_res.json()


# ---------------------------------------------------------------------------
# Test 1: DB-level user_id is stored at checkout time
# ---------------------------------------------------------------------------

def test_checkout_stores_user_id_in_database():
    get_or_create_test_users()
    mgr_client, _ = _make_client(MANAGER_EMAIL, MANAGER_PASS)
    csh_client, cashier_id = _make_client(CASHIER_EMAIL, CASHIER_PASS)

    prod_id = _create_product(mgr_client, name="Attribution DB Test")
    checkout = _checkout_as(csh_client, prod_id)
    order_id = checkout["order"]["id"]

    db = SessionLocal()
    try:
        row = db.query(Order).filter(Order.id == order_id).first()
        assert row is not None
        assert row.user_id == cashier_id, (
            f"Expected orders.user_id={cashier_id}, got {row.user_id}"
        )
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Test 2: GET /orders returns handled_by with correct operator info
# ---------------------------------------------------------------------------

def test_api_returns_handled_by_for_authenticated_order():
    get_or_create_test_users()
    mgr_client, mgr_id = _make_client(MANAGER_EMAIL, MANAGER_PASS)
    csh_client, cashier_id = _make_client(CASHIER_EMAIL, CASHIER_PASS)

    prod_id = _create_product(mgr_client, name="Attribution API Test")
    checkout = _checkout_as(csh_client, prod_id)
    order_id = checkout["order"]["id"]

    # Fetch order list as manager and find the order
    orders_res = mgr_client.get("/orders")
    assert orders_res.status_code == 200
    orders = orders_res.json()

    order = next((o for o in orders if o["id"] == order_id), None)
    assert order is not None, "Created order not found in GET /orders response."

    handled_by = order.get("handled_by")
    assert handled_by is not None, "Expected handled_by to be populated, got null."
    assert handled_by["id"] == cashier_id
    assert handled_by["email"] == CASHIER_EMAIL
    assert handled_by["role"] == "cashier"
    assert "display_name" in handled_by
    # Security: password hash must NOT be present
    assert "hashed_password" not in handled_by
    assert "password" not in handled_by


# ---------------------------------------------------------------------------
# Test 3: A different logged-in user sees the ORIGINAL handler, not themselves
# ---------------------------------------------------------------------------

def test_viewer_sees_original_handler_not_themselves():
    get_or_create_test_users()
    mgr_client, mgr_id = _make_client(MANAGER_EMAIL, MANAGER_PASS)
    csh_client, cashier_id = _make_client(CASHIER_EMAIL, CASHIER_PASS)

    prod_id = _create_product(mgr_client, name="Attribution Viewer Test")
    checkout = _checkout_as(csh_client, prod_id)
    order_id = checkout["order"]["id"]

    # Manager views the same order — should still see CASHIER as handler
    order_res = mgr_client.get(f"/orders/{order_id}")
    assert order_res.status_code == 200
    order = order_res.json()

    handled_by = order.get("handled_by")
    assert handled_by is not None
    assert handled_by["id"] == cashier_id, (
        f"Manager is viewing the order but handler shows id={handled_by['id']} "
        f"instead of the cashier id={cashier_id}."
    )
    assert handled_by["id"] != mgr_id, (
        "Handler was incorrectly attributed to the viewing manager."
    )


# ---------------------------------------------------------------------------
# Test 4: Legacy order with NULL user_id returns handled_by=null
# ---------------------------------------------------------------------------

def test_legacy_order_with_null_user_id_returns_handled_by_null():
    get_or_create_test_users()
    mgr_client, _ = _make_client(MANAGER_EMAIL, MANAGER_PASS)
    csh_client, _ = _make_client(CASHIER_EMAIL, CASHIER_PASS)

    prod_id = _create_product(mgr_client, name="Legacy Attribution Test")
    checkout = _checkout_as(csh_client, prod_id)
    order_id = checkout["order"]["id"]

    # Manually clear the user_id to simulate a legacy pre-auth order
    db = SessionLocal()
    try:
        row = db.query(Order).filter(Order.id == order_id).first()
        row.user_id = None
        db.commit()
    finally:
        db.close()

    # Any authenticated user viewing this order must get handled_by=null
    for u_client, label in [(mgr_client, "manager"), (csh_client, "cashier")]:
        order_res = u_client.get(f"/orders/{order_id}")
        assert order_res.status_code == 200, f"GET /orders/{order_id} failed for {label}"
        order = order_res.json()
        assert order.get("handled_by") is None, (
            f"Legacy order should have handled_by=null when viewed by {label}, "
            f"but got: {order.get('handled_by')}"
        )
