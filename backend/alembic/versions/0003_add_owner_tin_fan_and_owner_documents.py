"""add owner tin/fan and owner_documents table

Revision ID: 0003_owner_tin_fan_docs
Revises: 0002_add_side_number
Create Date: 2025-12-29 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0003_owner_tin_fan_docs'
down_revision = '0002_add_side_number'
branch_labels = None
depends_on = None


def upgrade():

    # Add tin_number and fan_number columns to owners if not present
    conn = op.get_bind()
    insp = sa.inspect(conn)
    owner_columns = [col['name'] for col in insp.get_columns('owners')]
    if 'tin_number' not in owner_columns:
        op.add_column('owners', sa.Column(
            'tin_number', sa.String(), nullable=True))
    if 'fan_number' not in owner_columns:
        op.add_column('owners', sa.Column(
            'fan_number', sa.String(), nullable=True))

    # Create owner_documents table if not present
    if 'owner_documents' not in insp.get_table_names():
        op.create_table(
            'owner_documents',
            sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
            sa.Column('owner_id', sa.Integer(), sa.ForeignKey(
                'owners.id'), nullable=False, index=True),
            sa.Column('doc_type', sa.String(), nullable=False),
            sa.Column('file_bucket', sa.String(), nullable=False),
            sa.Column('file_path', sa.String(), nullable=False),
            sa.Column('file_url', sa.String(), nullable=False),
            sa.Column('status', sa.String(), nullable=False,
                      server_default='pending'),
            sa.Column('rejection_reason', sa.String(), nullable=True),
            sa.Column('uploaded_at', sa.DateTime(), nullable=True),
            sa.Column('reviewed_at', sa.DateTime(), nullable=True),
            sa.Column('reviewed_by_user_id', sa.Integer(), nullable=True),
        )
        op.create_index('ix_owner_documents_owner_id',
                        'owner_documents', ['owner_id'])


def downgrade():
    # drop owner_documents table and indexes
    op.drop_index('ix_owner_documents_owner_id', table_name='owner_documents')
    op.drop_table('owner_documents')

    # drop tin/fan columns
    op.drop_column('owners', 'fan_number')
    op.drop_column('owners', 'tin_number')
