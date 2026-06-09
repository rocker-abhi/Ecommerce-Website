import uuid
from sqlalchemy import ForeignKey, Integer, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class CartItemModel(BaseModel):
    __tablename__ = "cart_items"

    cart_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("carts.id", ondelete="CASCADE"),
        nullable=False
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False
    )
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    # Relationships
    cart: Mapped["CartModel"] = relationship(
        "CartModel", back_populates="cart_items"
    )

    product: Mapped["ProductModel"] = relationship(
        "ProductModel", back_populates="cart_items"
    )
