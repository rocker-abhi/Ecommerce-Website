from typing import List

from sqlalchemy import Boolean, CheckConstraint, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from werkzeug.security import (
    check_password_hash,
    generate_password_hash,
)

from .addresses import AddressModel
from .base import BaseModel


class UserModel(BaseModel):
    __tablename__ = "users"

    __table_args__ = (
        CheckConstraint("age > 18 AND age < 100", name="ck_users_age"),
        CheckConstraint("length(name) > 3", name="ck_users_name_length"),
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    age: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    is_admin: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(
            self.password_hash,
            password,
        )

    # adding th relationship
    addresses: Mapped[List["AddressModel"]] = relationship(
        "AddressModel", back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<User {self.email}>"
