from typing import List
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class CategoryModel(BaseModel):
    __tablename__ = "categories"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str] = mapped_column(String(255), nullable=True)

    # One-to-many relationship with SubCategoryModel
    subcategories: Mapped[List["SubCategoryModel"]] = relationship(
        "SubCategoryModel", back_populates="category", cascade="all, delete-orphan"
    )

    # One-to-many relationship with ProductModel
    products: Mapped[List["ProductModel"]] = relationship(
        "ProductModel", back_populates="category", cascade="all, delete-orphan"
    )
