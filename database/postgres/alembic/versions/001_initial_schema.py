"""001_initial_schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-09-03 21:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# revision identifiers, used by Alembic.
revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Create Users Table
    op.create_table(
        'users',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('email', sa.String(255), nullable=False, unique=True),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('full_name', sa.String(150), nullable=False),
        sa.Column('role', sa.String(50), nullable=False, server_default='INVESTIGATOR'),
        sa.Column('agency_or_firm', sa.String(200), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('1')),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('idx_users_email', 'users', ['email'], unique=True)

    # 2. Create Cases Table
    op.create_table(
        'cases',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('case_number', sa.String(64), nullable=False, unique=True),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('status', sa.String(50), nullable=False, server_default='ACTIVE'),
        sa.Column('primary_investigator_id', sa.String(36), sa.ForeignKey('users.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('idx_cases_investigator', 'cases', ['primary_investigator_id'])
    op.create_index('idx_cases_number', 'cases', ['case_number'], unique=True)

    # 3. Create Suspect Wallets Table
    op.create_table(
        'suspect_wallets',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('case_id', sa.String(36), sa.ForeignKey('cases.id', ondelete='CASCADE'), nullable=False),
        sa.Column('address', sa.String(128), nullable=False),
        sa.Column('network', sa.String(50), nullable=False),
        sa.Column('reported_victim_loss_usd', sa.Numeric(18, 2), nullable=True, server_default='0.0'),
        sa.Column('added_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint('case_id', 'address', 'network', name='uq_case_wallet')
    )
    op.create_index('idx_suspect_wallets_address', 'suspect_wallets', ['address'])
    op.create_index('idx_suspect_wallets_case', 'suspect_wallets', ['case_id'])

    # 4. Create VASP Entities Table
    op.create_table(
        'vasp_entities',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('vasp_name', sa.String(150), nullable=False, unique=True),
        sa.Column('legal_entity_name', sa.String(255), nullable=True),
        sa.Column('jurisdiction_code', sa.String(3), nullable=True),
        sa.Column('risk_level', sa.String(50), nullable=False, server_default='LOW'),
        sa.Column('compliance_email', sa.String(255), nullable=True),
        sa.Column('travel_rule_compliant', sa.Boolean(), nullable=False, server_default=sa.text('1')),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('idx_vasp_entities_name', 'vasp_entities', ['vasp_name'], unique=True)

    # 5. Create Evidence Reports Table
    op.create_table(
        'evidence_reports',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('case_id', sa.String(36), sa.ForeignKey('cases.id', ondelete='CASCADE'), nullable=False),
        sa.Column('generated_by', sa.String(36), sa.ForeignKey('users.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('sha256_hash', sa.String(64), nullable=False),
        sa.Column('s3_storage_uri', sa.String(512), nullable=False),
        sa.Column('report_metadata', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('idx_evidence_sha256', 'evidence_reports', ['sha256_hash'])
    op.create_index('idx_evidence_case', 'evidence_reports', ['case_id'])

    # 6. Create Audit Logs Table
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('case_id', sa.String(36), sa.ForeignKey('cases.id', ondelete='SET NULL'), nullable=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('action', sa.String(100), nullable=False),
        sa.Column('payload_snapshot', sa.JSON(), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('idx_audit_logs_case', 'audit_logs', ['case_id'])


def downgrade() -> None:
    op.drop_table('audit_logs')
    op.drop_table('evidence_reports')
    op.drop_table('vasp_entities')
    op.drop_table('suspect_wallets')
    op.drop_table('cases')
    op.drop_table('users')
