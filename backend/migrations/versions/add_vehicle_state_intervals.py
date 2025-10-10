"""add vehicle_state_intervals table

Revision ID: vehicle_states_001
Revises: 
Create Date: 2025-01-15 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime


# revision identifiers, used by Alembic.
revision = 'vehicle_states_001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Crear tabla vehicle_state_intervals
    op.create_table(
        'vehicle_state_intervals',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('vehicle_id', sa.String(length=50), nullable=False),
        sa.Column('organization_id', sa.Integer(), nullable=False),
        sa.Column('state_key', sa.Integer(), nullable=False),
        sa.Column('start_time', sa.DateTime(), nullable=False),
        sa.Column('end_time', sa.DateTime(), nullable=True),
        sa.Column('duration_seconds', sa.BigInteger(), nullable=True),
        sa.Column('origin', sa.String(length=50), nullable=False),
        sa.Column('geofence_id', sa.String(length=100), nullable=True),
        sa.Column('session_id', sa.String(length=100), nullable=True),
        sa.Column('metadata_json', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, default=datetime.utcnow),
        sa.Column('updated_at', sa.DateTime(), default=datetime.utcnow, onupdate=datetime.utcnow),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Crear índices
    op.create_index('idx_vehicle_id', 'vehicle_state_intervals', ['vehicle_id'])
    op.create_index('idx_organization_id', 'vehicle_state_intervals', ['organization_id'])
    op.create_index('idx_state_key', 'vehicle_state_intervals', ['state_key'])
    op.create_index('idx_start_time', 'vehicle_state_intervals', ['start_time'])
    op.create_index('idx_vehicle_time_range', 'vehicle_state_intervals', ['vehicle_id', 'start_time', 'end_time'])
    op.create_index('idx_org_vehicle_state', 'vehicle_state_intervals', ['organization_id', 'vehicle_id', 'state_key'])
    op.create_index('idx_time_range_state', 'vehicle_state_intervals', ['start_time', 'end_time', 'state_key'])


def downgrade():
    # Eliminar índices
    op.drop_index('idx_time_range_state', table_name='vehicle_state_intervals')
    op.drop_index('idx_org_vehicle_state', table_name='vehicle_state_intervals')
    op.drop_index('idx_vehicle_time_range', table_name='vehicle_state_intervals')
    op.drop_index('idx_start_time', table_name='vehicle_state_intervals')
    op.drop_index('idx_state_key', table_name='vehicle_state_intervals')
    op.drop_index('idx_organization_id', table_name='vehicle_state_intervals')
    op.drop_index('idx_vehicle_id', table_name='vehicle_state_intervals')
    
    # Eliminar tabla
    op.drop_table('vehicle_state_intervals')

