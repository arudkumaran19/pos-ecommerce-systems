import uuid
from fastapi.testclient import TestClient

def test_registration_and_login_flow(client: TestClient):
    email = f"customer_{uuid.uuid4().hex[:8]}@example.com"
    pwd = "StrongPassword123!"
    
    # 1. Register
    reg_res = client.post("/api/v1/auth/register", json={
        "email": email,
        "full_name": "Jane Customer",
        "password": pwd
    })
    assert reg_res.status_code == 200
    csrf_token = reg_res.json().get("csrf_token")
    assert csrf_token is not None
    assert "task02_session" in reg_res.headers.get("set-cookie", "")
    
    # 2. Access profile with session cookie
    me_res = client.get("/api/v1/profile/me")
    assert me_res.status_code == 200
    assert me_res.json()["email"] == email.lower()
    assert me_res.json()["full_name"] == "Jane Customer"
    
    # 3. CSRF Protection: State-changing request without CSRF token must fail
    patch_res = client.patch("/api/v1/profile/me", json={"full_name": "New Name"})
    assert patch_res.status_code == 403
    
    # 4. State-changing request with valid CSRF token must succeed
    patch_res_ok = client.patch(
        "/api/v1/profile/me",
        json={"full_name": "Jane Updated"},
        headers={"X-CSRF-Token": csrf_token}
    )
    assert patch_res_ok.status_code == 200
    assert patch_res_ok.json()["full_name"] == "Jane Updated"
    
    # 5. Logout
    logout_res = client.post("/api/v1/auth/logout")
    assert logout_res.status_code == 200
    
    # 6. Profile access should now be unauthorized
    assert client.get("/api/v1/profile/me").status_code == 401

def test_anti_enumeration_forgot_password(client: TestClient):
    # Requesting reset for non-existent email returns generic success message
    res = client.post("/api/v1/auth/forgot-password", json={
        "email": "definitely_nonexistent_email_12345@example.com"
    })
    assert res.status_code == 200
    assert "If an account exists" in res.json()["message"]


def test_csrf_endpoint_and_lifecycle(client: TestClient):
    email = f"csrf_test_{uuid.uuid4().hex[:8]}@example.com"
    pwd = "StrongPassword123!"
    reg_res = client.post("/api/v1/auth/register", json={
        "email": email,
        "full_name": "CSRF Tester",
        "password": pwd
    })
    assert reg_res.status_code == 200
    initial_csrf = reg_res.json().get("csrf_token")
    assert initial_csrf is not None

    # Fetch token via dedicated /auth/csrf endpoint
    csrf_res = client.get("/api/v1/auth/csrf")
    assert csrf_res.status_code == 200
    fetched_token = csrf_res.json().get("csrf_token")
    assert fetched_token == initial_csrf

    # Verify mutating with fetched token works
    update_res = client.patch(
        "/api/v1/profile/me",
        json={"full_name": "CSRF Updated"},
        headers={"X-CSRF-Token": fetched_token}
    )
    assert update_res.status_code == 200
    assert update_res.json()["full_name"] == "CSRF Updated"

