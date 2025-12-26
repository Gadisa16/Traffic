"""add side_number to vehicles

Revision ID: 0002_add_side_number
Revises: 0001_add_soft_delete_to_vehicles
Create Date: 2025-12-24 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0002_add_side_number'
down_revision = '0001_add_soft_delete_to_vehicles'
branch_labels = None
depends_on = None


def upgrade():
    # add side_number column (nullable for existing data)
    op.add_column('vehicles', sa.Column(
        'side_number', sa.String(), nullable=True))
    # create index and unique constraint for faster lookups and uniqueness
    op.create_index('ix_vehicles_side_number', 'vehicles', ['side_number'])
    op.create_unique_constraint(
        'uq_vehicles_side_number', 'vehicles', ['side_number'])


def downgrade():
    op.drop_constraint('uq_vehicles_side_number', 'vehicles', type_='unique')
    op.drop_index('ix_vehicles_side_number', table_name='vehicles')
    op.drop_column('vehicles', 'side_number')
