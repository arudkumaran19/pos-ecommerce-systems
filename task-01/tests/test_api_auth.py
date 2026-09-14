from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.core.security import SESSION_COOKIE_NAME, hash_password
from app.db.session import SessionLocal
from app.main import app
from app.models.product import Product
from app.models.user import User, UserRole, UserSession

client = TestClient(app)


def get_or_create_test_users():
    db = SessionLocal()
    try:
        manager = db.query(User).filter(User.email == "test_manager@techloom.com").first()
        if not manager:
            manager = User(
                email="test_manager@techloom.com",
                hashed_password=hash_password("ManagerPass123!"),
                display_name="Test Manager",
                role=UserRole.MANAGER.value,
                is_active=True,
            )
            db.add(manager)

        cashier = db.query(User).filter(User.email == "test_cashier@techloom.com").first()
        if not cashier:
            cashier = User(
                email="test_cashier@techloom.com",
                hashed_password=hash_password("CashierPass123!"),
                display_name="Test Cashier",
                role=UserRole.CASHIER.value,
                is_active=True,
            )
            db.add(cashier)

        inactive = db.query(User).filter(User.email == "test_inactive@techloom.com").first()
        if not inactive:
            inactive = User(
                email="test_inactive@techloom.com",
                hashed_password=hash_password("InactivePass123!"),
                display_name="Test Inactive",
                role=UserRole.CASHIER.value,
                is_active=False,
            )
            db.add(inactive)

        db.commit()
    finally:
        db.close()


def test_login_success_and_cookie_set():
    get_or_create_test_users()

    response = client.post(
        "/auth/login",
        json={"email": "test_cashier@techloom.com", "password": "CashierPass123!"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Login successful"
    assert data["user"]["email"] == "test_cashier@techloom.com"
    assert data["user"]["role"] == "cashier"
    assert SESSION_COOKIE_NAME in response.cookies


def test_login_invalid_password_returns_401():
    get_or_create_test_users()

    response = client.post(
        "/auth/login",
        json={"email": "test_cashier@techloom.com", "password": "WrongPassword999!"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


def test_login_nonexistent_email_returns_401():
    response = client.post(
        "/auth/login",
        json={"email": "ghost_user_does_not_exist@techloom.com", "password": "AnyPassword123!"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


def test_login_inactive_user_returns_401():
    get_or_create_test_users()

    response = client.post(
        "/auth/login",
        json={"email": "test_inactive@techloom.com", "password": "InactivePass123!"},
    )
    assert response.status_code == 401
    assert "inactive" in response.json()["detail"].lower()


def test_get_me_authenticated_and_unauthenticated():
    get_or_create_test_users()

    # Fresh client for unauthenticated request
    fresh_client = TestClient(app)
    unauth_res = fresh_client.get("/auth/me")
    assert unauth_res.status_code == 401

    # Login as manager
    login_res = fresh_client.post(
        "/auth/login",
        json={"email": "test_manager@techloom.com", "password": "ManagerPass123!"},
    )
    assert login_res.status_code == 200

    # Authenticated /auth/me request
    auth_res = fresh_client.get("/auth/me")
    assert auth_res.status_code == 200
    assert auth_res.json()["email"] == "test_manager@techloom.com"
    assert auth_res.json()["role"] == "manager"


def test_logout_revokes_server_side_session():
    get_or_create_test_users()

    login_res = client.post(
        "/auth/login",
        json={"email": "test_cashier@techloom.com", "password": "CashierPass123!"},
    )
    assert login_res.status_code == 200
    cookie = login_res.cookies[SESSION_COOKIE_NAME]

    # Confirm session works
    me_res = client.get("/auth/me", cookies={SESSION_COOKIE_NAME: cookie})
    assert me_res.status_code == 200

    # Logout
    logout_res = client.post("/auth/logout", cookies={SESSION_COOKIE_NAME: cookie})
    assert logout_res.status_code == 200

    # Replay same cookie -> must return 401 Unauthorized!
    replay_res = client.get("/auth/me", cookies={SESSION_COOKIE_NAME: cookie})
    assert replay_res.status_code == 401


def test_expired_session_returns_401():
    get_or_create_test_users()

    login_res = client.post(
        "/auth/login",
        json={"email": "test_cashier@techloom.com", "password": "CashierPass123!"},
    )
    assert login_res.status_code == 200
    cookie = login_res.cookies[SESSION_COOKIE_NAME]

    # Manually expire session in DB
    db = SessionLocal()
    try:
        from app.core.security import hash_session_token
        h = hash_session_token(cookie)
        session_obj = db.query(UserSession).filter(UserSession.token_hash == h).first()
        assert session_obj is not None
        session_obj.expires_at = datetime.now(timezone.utc) - timedelta(hours=1)
        db.commit()
    finally:
        db.close()

    # Now request with expired cookie
    res = client.get("/auth/me", cookies={SESSION_COOKIE_NAME: cookie})
    assert res.status_code == 401


def test_unauthenticated_protected_endpoints_return_401():
    fresh_client = TestClient(app)
    # Endpoints must reject requests without valid session cookie
    assert fresh_client.get("/products").status_code == 401
    assert fresh_client.post("/products", json={"name": "X", "price": 10, "available_stock": 5}).status_code == 401
    assert fresh_client.post("/carts", json={}).status_code == 401
    assert fresh_client.get("/orders").status_code == 401


def test_cashier_rbac_denied_manager_endpoints():
    get_or_create_test_users()

    # Login as cashier
    login_res = client.post(
        "/auth/login",
        json={"email": "test_cashier@techloom.com", "password": "CashierPass123!"},
    )
    cashier_cookie = {SESSION_COOKIE_NAME: login_res.cookies[SESSION_COOKIE_NAME]}

    # Cashier can view products & orders
    assert client.get("/products", cookies=cashier_cookie).status_code == 200
    assert client.get("/orders", cookies=cashier_cookie).status_code == 200

    # Cashier attempt to POST /products -> 403 Forbidden!
    post_res = client.post(
        "/products",
        json={"name": "Illegal Cashier Product", "price": 9.99, "available_stock": 10},
        cookies=cashier_cookie,
    )
    assert post_res.status_code == 403
    assert "Manager permission required" in post_res.json()["detail"]

    # Cashier attempt to PATCH /products/1 -> 403 Forbidden!
    patch_res = client.patch(
        "/products/1",
        json={"name": "Illegal Name"},
        cookies=cashier_cookie,
    )
    assert patch_res.status_code == 403

    # Cashier attempt to DELETE /products/1 -> 403 Forbidden!
    del_res = client.delete("/products/1", cookies=cashier_cookie)
    assert del_res.status_code == 403


def test_manager_rbac_allowed_product_crud():
    get_or_create_test_users()

    # Login as manager
    login_res = client.post(
        "/auth/login",
        json={"email": "test_manager@techloom.com", "password": "ManagerPass123!"},
    )
    manager_cookie = {SESSION_COOKIE_NAME: login_res.cookies[SESSION_COOKIE_NAME]}

    # Manager creates product
    create_res = client.post(
        "/products",
        json={"name": "Manager Auth Test Blend", "price": 18.50, "available_stock": 25},
        cookies=manager_cookie,
    )
    assert create_res.status_code == 201
    prod_id = create_res.json()["id"]

    # Manager updates product
    update_res = client.patch(
        f"/products/{prod_id}",
        json={"price": 19.50},
        cookies=manager_cookie,
    )
    assert update_res.status_code == 200
    assert float(update_res.json()["price"]) == 19.50

    # Manager deletes product
    del_res = client.delete(f"/products/{prod_id}", cookies=manager_cookie)
    assert del_res.status_code == 204


def test_order_audit_user_id_recorded_on_checkout():
    get_or_create_test_users()

    # 1. Manager creates a product with stock
    mgr_login = client.post(
        "/auth/login",
        json={"email": "test_manager@techloom.com", "password": "ManagerPass123!"},
    )
    mgr_cookie = {SESSION_COOKIE_NAME: mgr_login.cookies[SESSION_COOKIE_NAME]}

    prod_res = client.post(
        "/products",
        json={"name": "Audit Trail Coffee", "price": 12.00, "available_stock": 10},
        cookies=mgr_cookie,
    )
    prod_id = prod_res.json()["id"]

    # 2. Cashier logs in, creates cart, adds item, and checks out
    csh_login = client.post(
        "/auth/login",
        json={"email": "test_cashier@techloom.com", "password": "CashierPass123!"},
    )
    csh_cookie = {SESSION_COOKIE_NAME: csh_login.cookies[SESSION_COOKIE_NAME]}
    cashier_user_id = csh_login.json()["user"]["id"]

    cart_res = client.post("/carts", json={}, cookies=csh_cookie)
    cart_id = cart_res.json()["id"]

    client.post(
        f"/carts/{cart_id}/items",
        json={"product_id": prod_id, "quantity": 2},
        cookies=csh_cookie,
    )

    checkout_res = client.post(f"/carts/{cart_id}/checkout", cookies=csh_cookie)
    assert checkout_res.status_code == 200
    order_id = checkout_res.json()["order"]["id"]

    # 3. Verify user_id is recorded on the order in the database for audit attribution
    db = SessionLocal()
    try:
        from app.models.order import Order
        order_row = db.query(Order).filter(Order.id == order_id).first()
        assert order_row is not None
        assert order_row.user_id == cashier_user_id
    finally:
        db.close()
