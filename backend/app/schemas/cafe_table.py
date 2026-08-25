from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class CafeTableCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    number: int = Field(..., ge=1)
    is_active: bool = True

class CafeTableUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    number: Optional[int] = Field(None, ge=1)
    is_active: Optional[bool] = None
    status: Optional[str] = None

class CafeTableResponse(BaseModel):
    id: str
    name: str
    number: int
    public_code: str
    status: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    qr_url: Optional[str] = None

    class Config:
        from_attributes = True

class CafeTableWithOrder(BaseModel):
    id: str
    name: str
    number: int
    public_code: str
    status: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    active_order: Optional[dict] = None
    qr_url: Optional[str] = None

    class Config:
        from_attributes = True
