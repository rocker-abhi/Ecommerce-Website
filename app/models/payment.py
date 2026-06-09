import uuid
from decimal import Decimal
from sqlalchemy import Enum as SQLEnum, ForeignKey, Numeric, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel
from app.models.enums.database_enums import PaymentStatus


class PaymentModel(BaseModel):
    __tablename__ = "payments"

    order_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    payment_method: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[PaymentStatus] = mapped_column(
        SQLEnum(PaymentStatus),
        default=PaymentStatus.PENDING,
        nullable=False
    )
    transaction_id: Mapped[str] = mapped_column(String(255), unique=True, nullable=True)

    # Relationships
    order: Mapped["OrderModel"] = relationship(
        "OrderModel", back_populates="payments"
    )
