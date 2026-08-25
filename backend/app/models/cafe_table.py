from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, DateTime, func, Integer, Boolean
from app.database.base import Base
import uuid
import secrets
from datetime import datetime

def generate_public_code():
    return secrets.token_hex(4)  # 8 chars hex, ej: a8f3d91e

class CafeTable(Base):
    __tablename__ = "cafe_tables"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    number: Mapped[int] = mapped_column(Integer, nullable=False, unique=True)
    public_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, default=generate_public_code)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="AVAILABLE")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
    last_browsing_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    orders = relationship("Order", back_populates="table")
