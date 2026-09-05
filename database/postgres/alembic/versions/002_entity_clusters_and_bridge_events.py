"""002_entity_clusters_and_bridge_events

Revision ID: 002_entity_clusters_and_bridge_events
Revises: 001_initial_schema
Create Date: 2026-09-04 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '002_entity_clusters_and_bridge_events'
down_revision = '001_initial_schema'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Create Entity Clusters Table
    op.create_table(
        'entity_clusters',
        sa.Column('cluster_id', sa.String(36), primary_key=True),
        sa.Column('primary_category', sa.String(50), nullable=False, server_default='UNKNOWN'),
        sa.Column('risk_score', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('wallet_addresses', sa.JSON(), nullable=False),
        sa.Column('case_id', sa.String(36), sa.ForeignKey('cases.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('idx_entity_clusters_case_id', 'entity_clusters', ['case_id'])

    # 2. Create Cross Chain Bridge Events Table
    op.create_table(
        'cross_chain_bridge_events',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('source_chain', sa.String(50), nullable=False),
        sa.Column('dest_chain', sa.String(50), nullable=False),
        sa.Column('usd_value', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('source_tx_hash', sa.String(128), nullable=False),
        sa.Column('dest_tx_hash', sa.String(128), nullable=False),
        sa.Column('source_wallet', sa.String(128), nullable=False),
        sa.Column('dest_wallet', sa.String(128), nullable=False),
        sa.Column('bridge_protocol', sa.String(100), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('idx_bridge_source_tx', 'cross_chain_bridge_events', ['source_tx_hash'])
    op.create_index('idx_bridge_source_wallet', 'cross_chain_bridge_events', ['source_wallet'])
    op.create_index('idx_bridge_dest_wallet', 'cross_chain_bridge_events', ['dest_wallet'])


def downgrade() -> None:
    op.drop_index('idx_bridge_dest_wallet', table_name='cross_chain_bridge_events')
    op.drop_index('idx_bridge_source_wallet', table_name='cross_chain_bridge_events')
    op.drop_index('idx_bridge_source_tx', table_name='cross_chain_bridge_events')
    op.drop_table('cross_chain_bridge_events')

    op.drop_index('idx_entity_clusters_case_id', table_name='entity_clusters')
    op.drop_table('entity_clusters')
