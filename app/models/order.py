import uuid
from decimal import Decimal
from typing import List
from sqlalchemy import Enum as SQLEnum, ForeignKey, Numeric, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel
from app.models.enums.database_enums import OrderStatus


class OrderModel(BaseModel):
    __tablename__ = "orders"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    total_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[OrderStatus] = mapped_column(
        SQLEnum(OrderStatus),
        default=OrderStatus.PENDING,
        nullable=False
    )

    # Relationships
    user: Mapped["UserModel"] = relationship(
        "UserModel", back_populates="orders"
    )

    order_items: Mapped[List["OrderItemModel"]] = relationship(
        "OrderItemModel", back_populates="order", cascade="all, delete-orphan"
    )

    payments: Mapped[List["PaymentModel"]] = relationship(
        "PaymentModel", back_populates="order", cascade="all, delete-orphan"
    )
