# importing libraries
from typing import Tuple
from types import MappingProxyType
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import DateTime, 
from datetime import datetime
import uuid

class Base(DeclarativeBase):
    pass

class BaseModel(Base):
    __abstract__ = True

    id:Mapped[uuid.uuid4] = mapped_column(
        primary_key = True,
        default=uuid.uuid4
    )

    created_at:Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )    

    update_at:Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )
