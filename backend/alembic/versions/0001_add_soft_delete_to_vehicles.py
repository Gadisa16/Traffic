"""add soft-delete columns to vehicles

Revision ID: 0001_add_soft_delete_to_vehicles
Revises: 
Create Date: 2025-12-14 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0001_add_soft_delete_to_vehicles'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # add is_deleted and deleted_at columns to vehicles table
    op.add_column('vehicles', sa.Column(
        'is_deleted', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('vehicles', sa.Column(
        'deleted_at', sa.DateTime(), nullable=True))
    # optional: create index on is_deleted for faster filtering
    op.create_index('ix_vehicles_is_deleted', 'vehicles', ['is_deleted'])


def downgrade():
    op.drop_index('ix_vehicles_is_deleted', table_name='vehicles')
    op.drop_column('vehicles', 'deleted_at')
    op.drop_column('vehicles', 'is_deleted')
