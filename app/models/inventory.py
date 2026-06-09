import uuid
from sqlalchemy import ForeignKey, Integer, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class InventoryModel(BaseModel):
    __tablename__ = "inventory"

    product_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        unique=True
    )
    quantity: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    sku: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)

    # Relationships
    product: Mapped["ProductModel"] = relationship(
        "ProductModel", back_populates="inventory"
    )
