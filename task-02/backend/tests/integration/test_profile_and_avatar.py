import io
import uuid
from PIL import Image
from fastapi.testclient import TestClient
from app.core.database import SessionLocal
from app.models.user import User

def create_dummy_image():
    file_obj = io.BytesIO()
    img = Image.new("RGB", (100, 100), color="blue")
    img.save(file_obj, format="PNG")
    file_obj.seek(0)
    return file_obj

def test_avatar_upload_remove_and_account_deletion(client: TestClient):
    email = f"avatar_user_{uuid.uuid4().hex[:8]}@example.com"
    reg = client.post("/api/v1/auth/register", json={
        "email": email,
        "full_name": "Avatar User",
        "password": "Password123!"
    })
    csrf = reg.json()["csrf_token"]
    
    # 1. Upload valid avatar image
    img_data = create_dummy_image()
    upload_res = client.post(
        "/api/v1/profile/avatar",
        files={"file": ("profile.png", img_data, "image/png")},
        headers={"X-CSRF-Token": csrf}
    )
    assert upload_res.status_code == 200
    avatar_url = upload_res.json()["avatar_url"]
    assert avatar_url.startswith("/media/avatars/")
    assert avatar_url.endswith(".webp")
    
    # 2. Remove avatar
    remove_res = client.delete("/api/v1/profile/avatar", headers={"X-CSRF-Token": csrf})
    assert remove_res.status_code == 200
    assert remove_res.json()["avatar_url"] is None
    
    # 3. Soft-delete account with anonymization
    del_res = client.delete("/api/v1/profile/account", headers={"X-CSRF-Token": csrf})
    assert del_res.status_code == 200
    
    # 4. Verify account is anonymized in DB
    db = SessionLocal()
    user = db.query(User).filter(User.full_name == "Deleted User").first()
    assert user is not None
    assert user.is_active is False
    assert user.deleted_at is not None
    assert "@deleted.invalid" in user.email
    db.close()
