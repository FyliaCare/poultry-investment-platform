from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None

class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str] = None
    is_admin: bool
    created_at: datetime
    class Config:
        from_attributes = True

class WalletOut(BaseModel):
    balance: float

class FarmIn(BaseModel):
    name: str
    location: Optional[str] = None
    notes: Optional[str] = None

class FarmOut(FarmIn):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

class BatchIn(BaseModel):
    farm_id: int
    product_type: str
    unit_price: float
    target_units: int
    feed_price: float = 6.0
    mortality_rate: float = 0.07
    expected_roi: float = 0.12

class BatchOut(BaseModel):
    id: int
    farm_id: int
    product_type: str
    unit_price: float
    target_units: int
    units_placed: int
    status: str
    feed_price: float
    mortality_rate: float
    expected_roi: float
    created_at: datetime
    class Config:
        from_attributes = True

class InvestmentIn(BaseModel):
    batch_id: int
    units: int

class InvestmentOut(BaseModel):
    id: int
    batch_id: int
    units: int
    amount: float
    status: str
    created_at: datetime
    class Config:
        from_attributes = True

class PayoutOut(BaseModel):
    id: int
    amount: float
    kind: str
    created_at: datetime
    class Config:
        from_attributes = True

class FAQOut(BaseModel):
    id: int
    question: str
    answer: str
    class Config:
        from_attributes = True

class PageOut(BaseModel):
    slug: str
    title: str
    body_md: str
    class Config:
        from_attributes = True
