import pytest
from uuid import uuid4
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.user import User, UserRole
from app.models.audit_log import AuditLog
from app.models.user_session import UserSession
from datetime import datetime, timedelta, timezone
from app.core.database import SessionLocal

def test_audit_identity_and_security(client: TestClient):
    db = SessionLocal()
    try:
        # 1. Register customer
        cust_email = f"sarah_{uuid4().hex[:8]}@example.com"
        reg_cust = client.post("/api/v1/auth/register", json={
            "email": cust_email,
            "full_name": "Sarah Connor",
            "password": "Password123!"
        })
        assert reg_cust.status_code == 200

        # 2. Customer forbidden from accessing audit logs (Point 9: 403 Forbidden)
        res_forbidden = client.get("/api/v1/admin/audit-logs")
        assert res_forbidden.status_code == 403

        # 3. Login as seeded admin
        admin_login = client.post("/api/v1/auth/login", json={
            "email": "admin@techloom.com",
            "password": "AdminSecurePass123!"
        })
        assert admin_login.status_code == 200
        admin_data = admin_login.json()
        admin_csrf = admin_data["csrf_token"]
        headers = {"X-CSRF-Token": admin_csrf}

        admin = db.query(User).filter(User.email == "admin@techloom.com").first()
        customer = db.query(User).filter(User.email == cust_email).first()

        # 3. Create Audit Events:
        # A) Admin modifying Customer (Actor: Admin, Target: Customer)
        log_admin_action = AuditLog(
            actor_user_id=admin.id,
            target_user_id=customer.id,
            action="ADMIN_USER_SUSPENDED",
            entity_type="USER",
            entity_id=str(customer.id),
            before_data={"is_active": True},
            after_data={"is_active": False},
            reason="Security audit precaution"
        )
        # B) Self-action: Customer registration (Actor: Customer, Target: Customer)
        log_self_action = AuditLog(
            actor_user_id=customer.id,
            target_user_id=customer.id,
            action="USER_REGISTERED",
            entity_type="USER",
            entity_id=str(customer.id),
            after_data={"email": customer.email, "role": "CUSTOMER"}
        )
        # C) System event: Sweeper expiring reservation (Actor: None, Target: Customer)
        log_system_action = AuditLog(
            actor_user_id=None,
            target_user_id=customer.id,
            action="ORDER_EXPIRED",
            entity_type="ORDER",
            entity_id=str(uuid4()),
            reason="Reservation TTL elapsed"
        )
        db.add_all([log_admin_action, log_self_action, log_system_action])
        db.commit()
        db.refresh(log_admin_action)
        db.refresh(log_self_action)
        db.refresh(log_system_action)

        # 4. Fetch audit logs as Admin
        res = client.get("/api/v1/admin/audit-logs?limit=100", headers=headers)
        assert res.status_code == 200
        data = res.json()
        items = {item["id"]: item for item in data["items"]}

        # Point 1, 2, 3, 4, 5: Actor & Target distinction and projection
        admin_act = items[str(log_admin_action.id)]
        assert admin_act["actor_user_id"] == str(admin.id)
        assert admin_act["target_user_id"] == str(customer.id)
        assert admin_act["actor"] is not None
        assert admin_act["actor"]["display_name"] == admin.full_name
        assert admin_act["actor"]["email"] == admin.email
        assert admin_act["actor"]["role"] == "ADMIN"
        assert admin_act["target"] is not None
        assert admin_act["target"]["display_name"] == "Sarah Connor"
        assert admin_act["target"]["email"] == cust_email
        assert admin_act["target"]["role"] == "CUSTOMER"

        # Point 6: Self-actions representation
        self_act = items[str(log_self_action.id)]
        assert self_act["actor_user_id"] == str(customer.id)
        assert self_act["target_user_id"] == str(customer.id)
        assert self_act["actor"]["display_name"] == "Sarah Connor"
        assert self_act["target"]["display_name"] == "Sarah Connor"

        # Point 8: System events don't fabricate users
        sys_act = items[str(log_system_action.id)]
        assert sys_act["actor_user_id"] is None
        assert sys_act["actor"] is None
        assert sys_act["target_user_id"] == str(customer.id)
        assert sys_act["target"]["display_name"] == "Sarah Connor"

        # Point 10: Security check - No sensitive credentials anywhere in payloads
        for item in data["items"]:
            raw_str = str(item).lower()
            assert "password_hash" not in raw_str
            assert "argon2" not in raw_str
            assert "session_token_hash" not in raw_str
            assert "csrf_token" not in raw_str

        # Point 7: Deleted/anonymized users remain attributable
        customer.deleted_at = datetime.now(timezone.utc)
        customer.full_name = "Deleted User"
        customer.email = f"deleted_{customer.id}@deleted.invalid"
        db.commit()

        res_after_delete = client.get("/api/v1/admin/audit-logs?limit=100", headers=headers)
        assert res_after_delete.status_code == 200
        items_after = {item["id"]: item for item in res_after_delete.json()["items"]}
        del_act = items_after[str(log_admin_action.id)]
        assert del_act["target_user_id"] == str(customer.id)
        assert del_act["target"]["is_deleted"] is True
        assert del_act["target"]["display_name"] == "Deleted account"

        # Point 11: Changing user's profile does not rewrite historical audit records
        # The historical action and timestamps and audit IDs remain strictly unchanged
        assert del_act["id"] == admin_act["id"]
        assert del_act["before_data"] == admin_act["before_data"]
        assert del_act["after_data"] == admin_act["after_data"]
    finally:
        db.close()
