from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime

class OrderItemCreate(BaseModel):
    product_id: str
    quantity: int = Field(..., ge=1, le=20)

class OrderCreate(BaseModel):
    table_code: str = Field(..., description="public_code de la mesa")
    customer_name: str = Field(..., min_length=1, max_length=100)
    order_type: str = Field(..., description="DINE_IN o TAKEAWAY")
    items: List[OrderItemCreate] = Field(..., min_length=1)

    @validator("order_type")
    def validate_order_type(cls, v):
        if v not in ["DINE_IN", "TAKEAWAY"]:
            raise ValueError("order_type debe ser DINE_IN o TAKEAWAY")
        return v

class OrderItemResponse(BaseModel):
    id: str
    product_id: Optional[str]
    product_name: str
    unit_price_cop: int
    quantity: int
    subtotal_cop: int
    created_at: datetime
    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: str
    public_code: str
    table_id: Optional[str]
    table_number: Optional[int] = None
    table_name: Optional[str] = None
    customer_name: str
    order_type: str
    status: str
    subtotal_cop: int
    total_cop: int
    created_at: datetime
    paid_at: Optional[datetime]
    delivered_at: Optional[datetime]
    updated_at: datetime
    items: List[OrderItemResponse] = []
    payments: List[dict] = []

    class Config:
        from_attributes = True

class PaymentCreate(BaseModel):
    payment_method: str = Field(..., description="CASH, CARD, NEQUI, DAVIPLATA, TRANSFER, OTHER")
    reference: Optional[str] = Field(None, max_length=200)
    notes: Optional[str] = None

    @validator("payment_method")
    def validate_method(cls, v):
        allowed = ["CASH", "CARD", "NEQUI", "DAVIPLATA", "TRANSFER", "OTHER"]
        if v not in allowed:
            raise ValueError(f"payment_method debe ser uno de {allowed}")
        return v

class OrderStatusUpdate(BaseModel):
    new_status: str

class MenuResponse(BaseModel):
    table: dict
    categories: List[dict]
    products: List[dict]
