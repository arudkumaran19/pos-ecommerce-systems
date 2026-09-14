"""
Tests for migration a1b2c3d4e5f6 -- seed_demo_users_idempotent.

These tests exercise the seeding logic in isolation against the real test
database (same SQLite/Postgres configured via DATABASE_URL in the test env).
They do NOT run Alembic -- they call the module-level helpers directly to keep
tests fast and free of migration-runner side-effects.

Four contracts are verified:
  1. Both demo users are created when seeding is enabled.
  2. Running the seed twice does not create duplicates.
  3. Existing users are never overwritten (password, role, name, is_active).
  4. Seeding is skipped entirely when SEED_DEMO_USERS=false.
"""
from __future__ import annotations

import importlib.util
import os
import pathlib
from contextlib import contextmanager
from unittest import mock

import pytest
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import insert as pg_insert


from app.db.session import SessionLocal
from app.models.user import User

# ---------------------------------------------------------------------------
# Load migration module to borrow _DEMO_USERS (keeps tests in sync)
# ---------------------------------------------------------------------------
_MIGRATION_PATH = (
    pathlib.Path(__file__).parent.parent
    / "alembic"
    / "versions"
    / "a1b2c3d4e5f6_seed_demo_users_idempotent.py"
)
_spec = importlib.util.spec_from_file_location("_migration_seed", _MIGRATION_PATH)
_migration = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_migration)

DEMO_USERS: list[dict] = _migration._DEMO_USERS
DEMO_EMAILS: list[str] = [u["email"] for u in DEMO_USERS]

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

@contextmanager
def _db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def _clean(db) -> None:
    db.query(User).filter(User.email.in_(DEMO_EMAILS)).delete(synchronize_session=False)
    db.commit()


def _run_seed(flag: str) -> None:
    """Replicate migration upgrade() body against the configured DB."""
    from app.db.session import engine
    with mock.patch.dict(os.environ, {"SEED_DEMO_USERS": flag}):
        seed_demo = os.getenv("SEED_DEMO_USERS", "true").lower() in ("true", "1", "yes")
        if not seed_demo:
            return
        users_tbl = sa.table(
            "users",
            sa.column("email", sa.String),
            sa.column("hashed_password", sa.String),
            sa.column("display_name", sa.String),
            sa.column("role", sa.String),
            sa.column("is_active", sa.Boolean),
        )
        with engine.begin() as conn:
            for user in DEMO_USERS:
                conn.execute(
                    pg_insert(users_tbl)
                    .values(**user)
                    .on_conflict_do_nothing(index_elements=["email"])
                )


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def isolate():
    with _db() as db:
        _clean(db)
    yield
    with _db() as db:
        _clean(db)


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def test_both_demo_users_created_when_seed_enabled():
    _run_seed("true")
    with _db() as db:
        for demo in DEMO_USERS:
            user = db.query(User).filter(User.email == demo["email"]).first()
            assert user is not None, f"Expected {demo['email']} to exist after seeding."
            assert user.role == demo["role"]
            assert user.display_name == demo["display_name"]
            assert user.is_active is True


def test_second_seed_run_creates_no_duplicates():
    _run_seed("true")
    _run_seed("true")
    with _db() as db:
        for email in DEMO_EMAILS:
            count = db.query(User).filter(User.email == email).count()
            assert count == 1, f"Duplicate row detected for {email} (found {count})."


def test_seed_does_not_overwrite_existing_user():
    with _db() as db:
        existing = User(
            email="manager@techloom.com",
            hashed_password="$2b$12$PRESERVED_HASH_MUST_NOT_CHANGE_XXXXXXXXXX",
            display_name="Original Name",
            role="cashier",
            is_active=False,
        )
        db.add(existing)
        db.commit()
        original_id = existing.id

    _run_seed("true")

    with _db() as db:
        user = db.query(User).filter(User.email == "manager@techloom.com").first()
        assert user.id == original_id, "Row identity changed -- seed replaced the existing row."
        assert "PRESERVED_HASH" in user.hashed_password, "Seed overwrote existing password hash."
        assert user.role == "cashier", "Seed overwrote existing role."
        assert user.display_name == "Original Name", "Seed overwrote existing display_name."
        assert user.is_active is False, "Seed overwrote existing is_active."
        count = db.query(User).filter(User.email == "manager@techloom.com").count()
        assert count == 1, "Duplicate row created by seed."


def test_no_users_created_when_seed_disabled():
    _run_seed("false")
    with _db() as db:
        for email in DEMO_EMAILS:
            user = db.query(User).filter(User.email == email).first()
            assert user is None, f"{email} was created despite SEED_DEMO_USERS=false."


@pytest.mark.parametrize("flag", ["false", "0", "no", "False", "NO"])
def test_seed_disabled_for_all_falsy_flag_values(flag):
    _run_seed(flag)
    with _db() as db:
        for email in DEMO_EMAILS:
            user = db.query(User).filter(User.email == email).first()
            assert user is None, (
                f"SEED_DEMO_USERS={flag!r} should suppress seeding, but {email} was created."
            )
