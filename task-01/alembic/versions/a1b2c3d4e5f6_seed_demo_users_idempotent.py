"""seed_demo_users_idempotent

Seeds the demo Manager and Cashier accounts in an idempotent, production-safe
way. Uses INSERT ... ON CONFLICT DO NOTHING so it is safe to run multiple times
and will never overwrite an existing user.

Gated by the SEED_DEMO_USERS environment variable (default: "true").
Runs regardless of ENVIRONMENT, so production demo deployments receive the
accounts when SEED_DEMO_USERS=true is set on the host.

Revision ID: a1b2c3d4e5f6
Revises: 3e69ec1b7d11
Create Date: 2026-09-14 20:19:00.000000

"""
import os
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import insert as pg_insert


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '3e69ec1b7d11'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# ---------------------------------------------------------------------------
# Exact demo credentials carried forward from migration 3e69ec1b7d11.
# These bcrypt hashes (cost factor 12) match the same passwords that were
# documented in 3e69ec1b7d11.  No raw passwords are stored here.
# ---------------------------------------------------------------------------
_DEMO_USERS = [
    {
        'email': 'manager@techloom.com',
        'hashed_password': '$2b$12$b9BaTz4d04IEyrzcv5SWK.z6UtDpIVnYoNnJXnc7k4XTQgGuRBNDa',
        'display_name': 'Maya Patel (Manager)',
        'role': 'manager',
        'is_active': True,
    },
    {
        'email': 'cashier@techloom.com',
        'hashed_password': '$2b$12$sMh3pd60PJ.QJidZ/eee2.udhElPHHNssxqpfSWNVyVGa6QIIC/ym',
        'display_name': 'Alex Reed (Cashier)',
        'role': 'cashier',
        'is_active': True,
    },
]


def upgrade() -> None:
    # Honour the gate flag — skip entirely when SEED_DEMO_USERS is falsy.
    seed_demo = os.getenv('SEED_DEMO_USERS', 'true').lower() in ('true', '1', 'yes')
    if not seed_demo:
        return

    # Use a raw connection to execute INSERT ... ON CONFLICT DO NOTHING.
    # This guarantees idempotency: running `alembic upgrade head` multiple
    # times or on a database that already has these users is a no-op.
    conn = op.get_bind()
    users = sa.table(
        'users',
        sa.column('email', sa.String),
        sa.column('hashed_password', sa.String),
        sa.column('display_name', sa.String),
        sa.column('role', sa.String),
        sa.column('is_active', sa.Boolean),
    )

    for user in _DEMO_USERS:
        conn.execute(
            pg_insert(users)
            .values(**user)
            .on_conflict_do_nothing(index_elements=['email'])
        )


def downgrade() -> None:
    # Downgrade removes the demo accounts only if SEED_DEMO_USERS is still set,
    # preserving any rows that were inserted by a manager after seeding.
    seed_demo = os.getenv('SEED_DEMO_USERS', 'true').lower() in ('true', '1', 'yes')
    if not seed_demo:
        return

    conn = op.get_bind()
    demo_emails = [u['email'] for u in _DEMO_USERS]
    conn.execute(
        sa.text("DELETE FROM users WHERE email = ANY(:emails)"),
        {'emails': demo_emails},
    )
