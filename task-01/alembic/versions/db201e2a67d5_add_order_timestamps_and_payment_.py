"""add_order_timestamps_and_payment_processed_at

Revision ID: db201e2a67d5
Revises: 65c01913c223
Create Date: 2026-09-14 15:25:32.542440

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'db201e2a67d5'
down_revision: Union[str, Sequence[str], None] = '65c01913c223'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add created_at / completed_at to orders and processed_at to payments."""

    # 1. orders.created_at — not nullable; backfill existing rows with now()
    op.add_column(
        'orders',
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=True),
    )
    op.execute("UPDATE orders SET created_at = NOW() AT TIME ZONE 'UTC' WHERE created_at IS NULL")
    op.alter_column('orders', 'created_at', nullable=False)

    # 2. orders.completed_at — nullable (only set when order reaches terminal state)
    op.add_column(
        'orders',
        sa.Column('completed_at', sa.TIMESTAMP(timezone=True), nullable=True),
    )

    # 3. payments.processed_at — nullable (set when payment is finalized)
    op.add_column(
        'payments',
        sa.Column('processed_at', sa.TIMESTAMP(timezone=True), nullable=True),
    )


def downgrade() -> None:
    """Remove timestamp columns."""
    op.drop_column('payments', 'processed_at')
    op.drop_column('orders', 'completed_at')
    op.drop_column('orders', 'created_at')
