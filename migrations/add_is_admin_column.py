"""Add is_admin column to users table

Revision ID: add_is_admin_column
Revises: previous_revision_id
Create Date: 2025-07-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_is_admin_column'
down_revision = 'previous_revision_id'  # Replace with your previous migration ID
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('users', sa.Column('is_admin', sa.Boolean(), nullable=False, server_default='0'))

def downgrade():
    op.drop_column('users', 'is_admin') 