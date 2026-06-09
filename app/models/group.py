import uuid
from typing import List
from sqlalchemy import Column, ForeignKey, String, Table, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, BaseModel

# Association Table for User <-> Group
user_groups = Table(
    "user_groups",
    Base.metadata,
    Column("user_id", Uuid, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("group_id", Uuid, ForeignKey("groups.id", ondelete="CASCADE"), primary_key=True),
)

# Association Table for Group <-> Permission
group_permissions = Table(
    "group_permissions",
    Base.metadata,
    Column("group_id", Uuid, ForeignKey("groups.id", ondelete="CASCADE"), primary_key=True),
    Column("permission_id", Uuid, ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True),
)


class GroupModel(BaseModel):
    __tablename__ = "groups"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str] = mapped_column(String(255), nullable=True)

    # Many-to-many relationship with UserModel
    users: Mapped[List["UserModel"]] = relationship(
        "UserModel", secondary=user_groups, back_populates="groups"
    )

    # Many-to-many relationship with PermissionModel
    permissions: Mapped[List["PermissionModel"]] = relationship(
        "PermissionModel", secondary=group_permissions, back_populates="groups"
    )
