import uuid
from fastapi.testclient import TestClient
from app.core.database import SessionLocal
from app.models.user import User, UserRole

def test_admin_rbac_and_self_safeguards(client: TestClient):
    # 1. Register normal customer
    cust_email = f"normal_cust_{uuid.uuid4().hex[:8]}@example.com"
    reg_cust = client.post("/api/v1/auth/register", json={
        "email": cust_email,
        "full_name": "Normal Customer",
        "password": "Password123!"
    })
    cust_csrf = reg_cust.json()["csrf_token"]
    
    # Customer forbidden from accessing admin endpoints
    assert client.get("/api/v1/admin/stats").status_code == 403
    assert client.get("/api/v1/admin/users").status_code == 403
    assert client.get("/api/v1/admin/audit-logs").status_code == 403

    # 2. Login as seeded admin
    admin_login = client.post("/api/v1/auth/login", json={
        "email": "admin@techloom.com",
        "password": "AdminSecurePass123!"
    })
    assert admin_login.status_code == 200
    admin_csrf = admin_login.json()["csrf_token"]
    admin_user = client.get("/api/v1/profile/me").json()
    admin_id = admin_user["id"]
    
    # 3. Admin stats accessible
    stats_res = client.get("/api/v1/admin/stats", headers={"X-CSRF-Token": admin_csrf})
    assert stats_res.status_code == 200
    assert "total_orders" in stats_res.json()

    # 4. Admin self-deactivation safeguard: Admin cannot deactivate themselves
    self_suspend_res = client.patch(
        f"/api/v1/admin/users/{admin_id}/status",
        json={"is_active": False},
        headers={"X-CSRF-Token": admin_csrf}
    )
    assert self_suspend_res.status_code == 403
    assert "cannot deactivate" in self_suspend_res.text.lower()

    # 5. Last active admin safeguard: Admin cannot demote last active admin
    demote_res = client.patch(
        f"/api/v1/admin/users/{admin_id}/role",
        json={"role": "CUSTOMER"},
        headers={"X-CSRF-Token": admin_csrf}
    )
    assert demote_res.status_code == 403 or demote_res.status_code == 409

    # 6. Admin inherits customer capabilities: Admin can shop for own account
    products = client.get("/api/v1/products?in_stock_only=true").json()["items"]
    assert len(products) > 0
    add_cart = client.post(
        "/api/v1/cart/items",
        json={"product_id": products[0]["id"], "quantity": 1},
        headers={"X-CSRF-Token": admin_csrf}
    )
    assert add_cart.status_code == 200
    
    # 7. Audit log inspection (read-only)
    audit_res = client.get("/api/v1/admin/audit-logs", headers={"X-CSRF-Token": admin_csrf})
    assert audit_res.status_code == 200
    assert len(audit_res.json()["items"]) > 0
