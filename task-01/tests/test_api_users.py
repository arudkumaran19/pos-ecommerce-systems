import pytest
from fastapi.testclient import TestClient

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.main import app
from app.models.user import User, UserRole, UserSession
from tests.test_api_auth import get_or_create_test_users


@pytest.fixture(autouse=True)
def setup_users():
    get_or_create_test_users()


def test_unauthenticated_cannot_access_users():
    client = TestClient(app)
    response = client.get("/users")
    assert response.status_code == 401


def test_cashier_forbidden_from_user_management():
    client = TestClient(app)
    # Login as cashier
    login_res = client.post(
        "/auth/login",
        json={"email": "test_cashier@techloom.com", "password": "CashierPass123!"},
    )
    assert login_res.status_code == 200

    # Attempt to list users
    res = client.get("/users")
    assert res.status_code == 403

    # Attempt to create user
    res = client.post(
        "/users",
        json={
            "email": "hacker@techloom.com",
            "password": "Password12345!",
            "display_name": "Hacker",
            "role": "manager",
        },
    )
    assert res.status_code == 403


def test_manager_can_list_users():
    client = TestClient(app)
    client.post(
        "/auth/login",
        json={"email": "test_manager@techloom.com", "password": "ManagerPass123!"},
    )

    response = client.get("/users")
    assert response.status_code == 200
    users = response.json()
    assert isinstance(users, list)
    assert len(users) >= 2
    emails = [u["email"] for u in users]
    assert "test_manager@techloom.com" in emails
    assert "test_cashier@techloom.com" in emails


def test_manager_can_create_user_and_validation():
    client = TestClient(app)
    client.post(
        "/auth/login",
        json={"email": "test_manager@techloom.com", "password": "ManagerPass123!"},
    )

    # 1. Short password (<12 chars) rejected
    res = client.post(
        "/users",
        json={
            "email": "new_barista@techloom.com",
            "password": "Short1!",
            "display_name": "New Barista",
            "role": "cashier",
        },
    )
    assert res.status_code == 422 or res.status_code == 400

    # 2. Invalid role rejected
    res = client.post(
        "/users",
        json={
            "email": "new_barista@techloom.com",
            "password": "ValidPassword123!",
            "display_name": "New Barista",
            "role": "superadmin",
        },
    )
    assert res.status_code == 400

    # 3. Valid creation
    unique_email = "new_barista_pos@techloom.com"
    # Clean up if existed from previous run
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == unique_email).first()
        if existing:
            db.delete(existing)
            db.commit()
    finally:
        db.close()

    res = client.post(
        "/users",
        json={
            "email": unique_email,
            "password": "SecurePassword123!",
            "display_name": "New Barista POS",
            "role": "cashier",
        },
    )
    assert res.status_code == 201
    created_user = res.json()
    assert created_user["email"] == unique_email
    assert created_user["role"] == "cashier"
    assert created_user["is_active"] is True
    assert "hashed_password" not in created_user

    # 4. Duplicate email rejected
    res_dup = client.post(
        "/users",
        json={
            "email": unique_email,
            "password": "SecurePassword123!",
            "display_name": "Another Barista",
            "role": "cashier",
        },
    )
    assert res_dup.status_code == 400


def test_manager_can_update_user_and_self_safeguards():
    client = TestClient(app)
    client.post(
        "/auth/login",
        json={"email": "test_manager@techloom.com", "password": "ManagerPass123!"},
    )

    db = SessionLocal()
    try:
        manager = db.query(User).filter(User.email == "test_manager@techloom.com").first()
        cashier = db.query(User).filter(User.email == "test_cashier@techloom.com").first()
        manager_id = manager.id
        cashier_id = cashier.id
    finally:
        db.close()

    # Self-deactivation blocked
    res = client.patch(f"/users/{manager_id}", json={"is_active": False})
    assert res.status_code == 400
    assert "cannot deactivate your own account" in res.json()["detail"].lower()

    # Self-demotion blocked
    res = client.patch(f"/users/{manager_id}", json={"role": "cashier"})
    assert res.status_code == 400
    assert "cannot demote your own account" in res.json()["detail"].lower()

    # Self-deletion blocked
    res = client.delete(f"/users/{manager_id}")
    assert res.status_code == 400
    assert "cannot delete your own account" in res.json()["detail"].lower()

    # Updating other user works
    res = client.patch(
        f"/users/{cashier_id}",
        json={"display_name": "Updated Cashier Name"},
    )
    assert res.status_code == 200
    assert res.json()["display_name"] == "Updated Cashier Name"


def test_deactivating_user_revokes_sessions():
    client_target = TestClient(app)
    # Login target user
    login_res = client_target.post(
        "/auth/login",
        json={"email": "test_cashier@techloom.com", "password": "CashierPass123!"},
    )
    assert login_res.status_code == 200
    target_id = login_res.json()["user"]["id"]

    # Verify session is working
    res_me = client_target.get("/auth/me")
    assert res_me.status_code == 200

    # Manager deactivates this user
    client_mgr = TestClient(app)
    client_mgr.post(
        "/auth/login",
        json={"email": "test_manager@techloom.com", "password": "ManagerPass123!"},
    )
    res_deactivate = client_mgr.patch(f"/users/{target_id}", json={"is_active": False})
    assert res_deactivate.status_code == 200
    assert res_deactivate.json()["is_active"] is False

    # Target user's session is now invalid immediately
    res_me_after = client_target.get("/auth/me")
    assert res_me_after.status_code == 401

    # Reactivate for future tests
    client_mgr.patch(f"/users/{target_id}", json={"is_active": True})


def test_password_reset_revokes_sessions():
    client_target = TestClient(app)
    # Login target user
    login_res = client_target.post(
        "/auth/login",
        json={"email": "test_cashier@techloom.com", "password": "CashierPass123!"},
    )
    assert login_res.status_code == 200
    target_id = login_res.json()["user"]["id"]

    # Session is working
    assert client_target.get("/auth/me").status_code == 200

    # Manager resets target user's password
    client_mgr = TestClient(app)
    client_mgr.post(
        "/auth/login",
        json={"email": "test_manager@techloom.com", "password": "ManagerPass123!"},
    )
    res_reset = client_mgr.patch(
        f"/users/{target_id}",
        json={"password": "NewSecurePassword123!"},
    )
    assert res_reset.status_code == 200

    # Target user's session is now revoked
    assert client_target.get("/auth/me").status_code == 401

    # Restore password
    client_mgr.patch(
        f"/users/{target_id}",
        json={"password": "CashierPass123!"},
    )


def test_role_change_immediately_revokes_manager_privileges():
    # Create or reset a secondary manager for testing role change
    db = SessionLocal()
    try:
        sub_mgr = db.query(User).filter(User.email == "sub_mgr@techloom.com").first()
        if not sub_mgr:
            sub_mgr = User(
                email="sub_mgr@techloom.com",
                hashed_password=hash_password("SubManagerPass123!"),
                display_name="Sub Manager",
                role=UserRole.MANAGER.value,
                is_active=True,
            )
            db.add(sub_mgr)
        else:
            sub_mgr.role = UserRole.MANAGER.value
            sub_mgr.is_active = True
        db.commit()
        db.refresh(sub_mgr)
        sub_mgr_id = sub_mgr.id
    finally:
        db.close()

    # Login as sub_mgr
    client_sub = TestClient(app)
    res_login = client_sub.post(
        "/auth/login",
        json={"email": "sub_mgr@techloom.com", "password": "SubManagerPass123!"},
    )
    assert res_login.status_code == 200

    # Sub manager can list users (manager privilege)
    assert client_sub.get("/users").status_code == 200

    # Primary manager demotes sub_mgr to cashier
    client_main = TestClient(app)
    client_main.post(
        "/auth/login",
        json={"email": "test_manager@techloom.com", "password": "ManagerPass123!"},
    )
    res_demote = client_main.patch(
        f"/users/{sub_mgr_id}",
        json={"role": "cashier"},
    )
    assert res_demote.status_code == 200
    assert res_demote.json()["role"] == "cashier"

    # Existing session of sub_mgr IMMEDIATELY loses manager access (403 Forbidden)
    assert client_sub.get("/users").status_code == 403

    # But still has cashier access to standard authenticated endpoints
    assert client_sub.get("/auth/me").status_code == 200
    assert client_sub.get("/orders").status_code == 200
