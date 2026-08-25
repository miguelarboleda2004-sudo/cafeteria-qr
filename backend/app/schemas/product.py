from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ProductCreate(BaseModel):
    category_id: str
    name: str = Field(..., min_length=1, max_length=150)
    description: Optional[str] = None
    price_cop: int = Field(..., ge=0, description="Precio en COP como entero")
    image_url: Optional[str] = None
    is_available: bool = True
    allow_dine_in: bool = True
    allow_takeaway: bool = True
    is_active: bool = True

class ProductUpdate(BaseModel):
    category_id: Optional[str] = None
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    description: Optional[str] = None
    price_cop: Optional[int] = Field(None, ge=0)
    image_url: Optional[str] = None
    is_available: Optional[bool] = None
    allow_dine_in: Optional[bool] = None
    allow_takeaway: Optional[bool] = None
    is_active: Optional[bool] = None

class ProductResponse(BaseModel):
    id: str
    category_id: str
    name: str
    description: Optional[str]
    price_cop: int
    image_url: Optional[str]
    image_path: Optional[str]
    is_available: bool
    allow_dine_in: bool
    allow_takeaway: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime
    category_name: Optional[str] = None

    class Config:
        from_attributes = True

class MenuProductResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    price_cop: int
    image_url: Optional[str]
    is_available: bool
    allow_dine_in: bool
    allow_takeaway: bool
    category_id: str
    category_name: str

    class Config:
        from_attributes = True
