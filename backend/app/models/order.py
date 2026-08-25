from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, DateTime, func, Integer, BigInteger, ForeignKey, Text
from app.database.base import Base
import uuid
import secrets
from datetime import datetime

def generate_order_code():
    # Formato: ORD-XXXXXX
    return f"ORD-{secrets.token_hex(3).upper()}"

class Order(Base):
    __tablename__ = "orders"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    public_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, default=generate_order_code)
    table_id: Mapped[str] = mapped_column(String, ForeignKey("cafe_tables.id"), nullable=True)
    customer_name: Mapped[str] = mapped_column(String(100), nullable=False)
    order_type: Mapped[str] = mapped_column(String(20), nullable=False)  # DINE_IN / TAKEAWAY
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="PENDING_PAYMENT")
    subtotal_cop: Mapped[int] = mapped_column(BigInteger, nullable=False)
    total_cop: Mapped[int] = mapped_column(BigInteger, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    paid_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    delivered_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    table = relationship("CafeTable", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="order", cascade="all, delete-orphan")
    status_history = relationship("OrderStatusHistory", back_populates="order", cascade="all, delete-orphan")
