"""merge multiple heads

Revision ID: 78d74854b714
Revises: 0d5b75d75238, 96a423b82fe2
Create Date: 2026-06-14 01:11:07.568178

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '78d74854b714'
down_revision: Union[str, Sequence[str], None] = ('0d5b75d75238', '96a423b82fe2')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
