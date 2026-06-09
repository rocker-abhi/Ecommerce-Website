import uuid
from typing import List
from sqlalchemy import ForeignKey, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class CartModel(BaseModel):
    __tablename__ = "carts"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True
    )

    # Relationships
    user: Mapped["UserModel"] = relationship(
        "UserModel", back_populates="cart"
    )

    cart_items: Mapped[List["CartItemModel"]] = relationship(
        "CartItemModel", back_populates="cart", cascade="all, delete-orphan"
    )
