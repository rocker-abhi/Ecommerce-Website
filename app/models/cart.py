import uuid
from sqlalchemy import ForeignKey, Uuid, JSON
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

    items: Mapped[list] = mapped_column(JSON, default=list, nullable=False)

    # Relationships
    user: Mapped["UserModel"] = relationship(
        "UserModel", back_populates="cart"
    )

