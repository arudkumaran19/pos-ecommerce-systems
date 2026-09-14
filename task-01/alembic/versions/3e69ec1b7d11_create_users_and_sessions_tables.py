"""create_users_and_sessions_tables

Revision ID: 3e69ec1b7d11
Revises: db201e2a67d5
Create Date: 2026-09-14 17:45:50.723863

"""
import os
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3e69ec1b7d11'
down_revision: Union[str, Sequence[str], None] = 'db201e2a67d5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create users table
    users_table = op.create_table(
        'users',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('display_name', sa.String(100), nullable=False),
        sa.Column('role', sa.String(20), nullable=False, server_default='cashier'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.CheckConstraint("role IN ('cashier', 'manager')", name='ck_users_role_valid'),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)
    op.create_index('ix_users_id', 'users', ['id'], unique=False)

    # 2. Create user_sessions table
    op.create_table(
        'user_sessions',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('token_hash', sa.String(64), nullable=False),
        sa.Column('expires_at', sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column('revoked_at', sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('last_used_at', sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text('now()')),
    )
    op.create_index('ix_user_sessions_user_id', 'user_sessions', ['user_id'], unique=False)
    op.create_index('ix_user_sessions_token_hash', 'user_sessions', ['token_hash'], unique=True)
    op.create_index('ix_user_sessions_expires_at', 'user_sessions', ['expires_at'], unique=False)

    # 3. Add user_id audit column to orders table
    op.add_column(
        'orders',
        sa.Column('user_id', sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        'fk_orders_user_id_users',
        'orders',
        'users',
        ['user_id'],
        ['id'],
        ondelete='SET NULL',
    )
    op.create_index('ix_orders_user_id', 'orders', ['user_id'], unique=False)

    # 4. Seed development demo accounts only if enabled and non-production
    seed_demo = os.getenv("SEED_DEMO_USERS", "true").lower() in ("true", "1", "yes")
    env = os.getenv("ENVIRONMENT", "development").lower()
    if seed_demo and env != "production":
        # Pre-computed bcrypt hashes (cost factor 12) for test/dev convenience:
        # Manager: ManagerPass123!
        # Cashier: CashierPass123!
        op.bulk_insert(
            users_table,
            [
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
            ],
        )


def downgrade() -> None:
    op.drop_index('ix_orders_user_id', table_name='orders')
    op.drop_constraint('fk_orders_user_id_users', 'orders', type_='foreignkey')
    op.drop_column('orders', 'user_id')

    op.drop_index('ix_user_sessions_expires_at', table_name='user_sessions')
    op.drop_index('ix_user_sessions_token_hash', table_name='user_sessions')
    op.drop_index('ix_user_sessions_user_id', table_name='user_sessions')
    op.drop_table('user_sessions')

    op.drop_index('ix_users_id', table_name='users')
    op.drop_index('ix_users_email', table_name='users')
    op.drop_table('users')
