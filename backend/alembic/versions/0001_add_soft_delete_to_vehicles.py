"""add soft-delete columns to vehicles

Revision ID: 0001_soft_delete_vehicles
Revises: 
Create Date: 2025-12-14 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0001_soft_delete_vehicles'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Add is_deleted and deleted_at columns to vehicles table if not present
    conn = op.get_bind()
    insp = sa.inspect(conn)
    columns = [col['name'] for col in insp.get_columns('vehicles')]
    if 'is_deleted' not in columns:
        op.add_column('vehicles', sa.Column(
            'is_deleted', sa.Integer(), nullable=False, server_default='0'))
    if 'deleted_at' not in columns:
        op.add_column('vehicles', sa.Column(
            'deleted_at', sa.DateTime(), nullable=True))
    # Create index on is_deleted if not present
    indexes = [ix['name'] for ix in insp.get_indexes('vehicles')]
    if 'ix_vehicles_is_deleted' not in indexes:
        op.create_index('ix_vehicles_is_deleted', 'vehicles', ['is_deleted'])


def downgrade():
    op.drop_index('ix_vehicles_is_deleted', table_name='vehicles')
    op.drop_column('vehicles', 'deleted_at')
    op.drop_column('vehicles', 'is_deleted')
