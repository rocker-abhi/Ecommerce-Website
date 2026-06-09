import uuid
from sqlalchemy import ForeignKey, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class WishlistItemModel(BaseModel):
    __tablename__ = "wishlist_items"

    wishlist_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("wishlists.id", ondelete="CASCADE"),
        nullable=False
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False
    )

    # Relationships
    wishlist: Mapped["WishlistModel"] = relationship(
        "WishlistModel", back_populates="wishlist_items"
    )

    product: Mapped["ProductModel"] = relationship(
        "ProductModel", back_populates="wishlist_items"
    )
