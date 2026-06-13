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

    refresh_tokens: Mapped[List["RefreshToken"]] = relationship(
        "RefreshToken", back_populates="user", cascade="all, delete-orphan"
    )

    groups: Mapped[List["GroupModel"]] = relationship(
        "GroupModel", secondary="user_groups", back_populates="users"
    )

    cart: Mapped["CartModel"] = relationship(
        "CartModel", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )

    orders: Mapped[List["OrderModel"]] = relationship(
        "OrderModel", back_populates="user", cascade="all, delete-orphan"
    )

    reviews: Mapped[List["ReviewModel"]] = relationship(
        "ReviewModel", back_populates="user", cascade="all, delete-orphan"
    )

    wishlist: Mapped["WishlistModel"] = relationship(
        "WishlistModel", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )

    products: Mapped[List["ProductModel"]] = relationship(
        "ProductModel", back_populates="seller", cascade="all, delete-orphan"
    )

    @property
    def userType(self) -> str:
        if any(group.name == "admin" for group in self.groups):
            return "admin"
        if any(group.name == "seller" for group in self.groups):
            return "seller"
        return "buyer"

    @property
    def address(self):
        active_addresses = [addr for addr in self.addresses if addr.is_active]
        if active_addresses:
            return active_addresses[0]
        if self.addresses:
            return self.addresses[0]
        return {"city": None, "state": None, "country": None}

    def __repr__(self):
        return f"<User {self.email}>"
