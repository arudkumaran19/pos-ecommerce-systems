"""fix_timestamptz_indexes_and_order_item_name

Revision ID: 65c01913c223
Revises: cade950e951e
Create Date: 2026-09-14 14:19:33.041165

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '65c01913c223'
down_revision: Union[str, Sequence[str], None] = 'cade950e951e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 1. Convert naive timestamp columns to TIMESTAMPTZ
    op.execute(
        "ALTER TABLE reservations "
        "ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE "
        "USING created_at AT TIME ZONE 'UTC'"
    )
    op.execute(
        "ALTER TABLE reservations "
        "ALTER COLUMN expires_at TYPE TIMESTAMP WITH TIME ZONE "
        "USING expires_at AT TIME ZONE 'UTC'"
    )
    op.execute(
        "ALTER TABLE reservations "
        "ALTER COLUMN released_at TYPE TIMESTAMP WITH TIME ZONE "
        "USING released_at AT TIME ZONE 'UTC'"
    )

    # 2. Add performance indexes
    op.create_index(
        'ix_reservations_status_expires_at',
        'reservations',
        ['status', 'expires_at'],
        unique=False,
    )
    op.create_index(
        'ix_cart_items_product_id',
        'cart_items',
        ['product_id'],
        unique=False,
    )
    op.create_index(
        'ix_orders_status',
        'orders',
        ['status'],
        unique=False,
    )

    # 3. Add product_name snapshot to order_items with backfill
    op.add_column(
        'order_items',
        sa.Column('product_name', sa.String(length=255), nullable=True),
    )
    op.execute(
        "UPDATE order_items "
        "SET product_name = COALESCE("
        "   (SELECT name FROM products WHERE products.id = order_items.product_id), "
        "   'Product'"
        ")"
    )
    op.alter_column(
        'order_items',
        'product_name',
        nullable=False,
    )

    # 4. Update payments status check constraint to include Refunded
    op.drop_constraint(
        'ck_payments_status_valid',
        'payments',
        type_='check',
    )
    op.create_check_constraint(
        'ck_payments_status_valid',
        'payments',
        "status IN ('Pending', 'Succeeded', 'Failed', 'TimedOut', 'Refunded')",
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint(
        'ck_payments_status_valid',
        'payments',
        type_='check',
    )
    op.create_check_constraint(
        'ck_payments_status_valid',
        'payments',
        "status IN ('Pending', 'Succeeded', 'Failed', 'TimedOut')",
    )

    op.drop_column('order_items', 'product_name')

    op.drop_index('ix_orders_status', table_name='orders')
    op.drop_index('ix_cart_items_product_id', table_name='cart_items')
    op.drop_index('ix_reservations_status_expires_at', table_name='reservations')

    op.execute(
        "ALTER TABLE reservations "
        "ALTER COLUMN released_at TYPE TIMESTAMP WITHOUT TIME ZONE"
    )
    op.execute(
        "ALTER TABLE reservations "
        "ALTER COLUMN expires_at TYPE TIMESTAMP WITHOUT TIME ZONE"
    )
    op.execute(
        "ALTER TABLE reservations "
        "ALTER COLUMN created_at TYPE TIMESTAMP WITHOUT TIME ZONE"
    )
