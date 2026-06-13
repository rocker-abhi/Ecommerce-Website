import uuid
from decimal import Decimal
from typing import List
from sqlalchemy import ForeignKey, String, Numeric, Uuid, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class ProductModel(BaseModel):
    __tablename__ = "products"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(String(1000), nullable=True)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    image_url: Mapped[str] = mapped_column(String(500), nullable=True)

    category_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True
    )
    subcategory_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("subcategories.id", ondelete="SET NULL"),
        nullable=True
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    sku: Mapped[str] = mapped_column(String(100), nullable=True)
    stock: Mapped[int] = mapped_column(Integer, nullable=False, default=50)

    # Relationships
    category: Mapped["CategoryModel"] = relationship(
        "CategoryModel", back_populates="products"
    )
    subcategory: Mapped["SubCategoryModel"] = relationship(
        "SubCategoryModel", back_populates="products"
    )

    seller: Mapped["UserModel"] = relationship(
        "UserModel", back_populates="products"
    )

    cart_items: Mapped[List["CartItemModel"]] = relationship(
        "CartItemModel", back_populates="product", cascade="all, delete-orphan"
    )

    order_items: Mapped[List["OrderItemModel"]] = relationship(
        "OrderItemModel", back_populates="product", cascade="all, delete-orphan"
    )

    reviews: Mapped[List["ReviewModel"]] = relationship(
        "ReviewModel", back_populates="product", cascade="all, delete-orphan"
    )

    wishlist_items: Mapped[List["WishlistItemModel"]] = relationship(
        "WishlistItemModel", back_populates="product", cascade="all, delete-orphan"
    )
