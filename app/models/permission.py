from typing import List
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class PermissionModel(BaseModel):
    __tablename__ = "permissions"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str] = mapped_column(String(255), nullable=True)

    # Many-to-many relationship with GroupModel
    groups: Mapped[List["GroupModel"]] = relationship(
        "GroupModel", secondary="group_permissions", back_populates="permissions"
    )
