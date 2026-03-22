"""optional session audit placeholder

Revision ID: 0001_optional_session_audit
Revises: 
Create Date: 2026-03-23 00:00:00
"""

from alembic import op
import sqlalchemy as sa

revision = "0001_optional_session_audit"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "mini_app_session_audits",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("telegram_user_id", sa.BigInteger(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("source", sa.String(length=32), nullable=False, server_default="telegram"),
    )


def downgrade() -> None:
    op.drop_table("mini_app_session_audits")
