import uuid
from typing import List
from sqlalchemy import String, ForeignKey, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class SubCategoryModel(BaseModel):
    __tablename__ = "subcategories"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(String(255), nullable=True)
    category_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("categories.id", ondelete="CASCADE"),
        nullable=False
    )

    # Relationships
    category: Mapped["CategoryModel"] = relationship(
        "CategoryModel", back_populates="subcategories"
    )
    products: Mapped[List["ProductModel"]] = relationship(
        "ProductModel", back_populates="subcategory", cascade="all, delete-orphan"
    )
