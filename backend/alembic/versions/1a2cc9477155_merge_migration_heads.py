"""merge migration heads

Revision ID: 1a2cc9477155
Revises: 7a918aec8ec0, f62db69dd975
Create Date: 2026-08-26 08:25:22.004975

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1a2cc9477155'
down_revision: Union[str, Sequence[str], None] = ('7a918aec8ec0', 'f62db69dd975')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
