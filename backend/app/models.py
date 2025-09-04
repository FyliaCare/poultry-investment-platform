from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float, Text, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from enum import Enum as PyEnum

from .database import Base

class ProductType(str, PyEnum):
    EGG = "EGG"
    CHICKEN = "CHICKEN"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    wallet = relationship("Wallet", back_populates="user", uselist=False, cascade="all, delete-orphan")
    investments = relationship("Investment", back_populates="user", cascade="all, delete")

class Wallet(Base):
    __tablename__ = "wallets"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    balance = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="wallet")

class Farm(Base):
    __tablename__ = "farms"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    location = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    batches = relationship("Batch", back_populates="farm", cascade="all, delete")

class Batch(Base):
    __tablename__ = "batches"
    id = Column(Integer, primary_key=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    product_type = Column(Enum(ProductType), nullable=False)
    start_date = Column(DateTime, default=datetime.utcnow)
    end_date = Column(DateTime, nullable=True)
    status = Column(String, default="PLANNED")  # PLANNED, ACTIVE, HARVESTED, CLOSED
    unit_price = Column(Float, default=0.0)     # price per unit for investors
    target_units = Column(Integer, default=0)
    units_placed = Column(Integer, default=0)
    feed_price = Column(Float, default=6.0)     # GHS/kg
    mortality_rate = Column(Float, default=0.07)
    expected_roi = Column(Float, default=0.12)  # per cycle (chicken) or monthly (egg)
    created_at = Column(DateTime, default=datetime.utcnow)

    farm = relationship("Farm", back_populates="batches")
    investments = relationship("Investment", back_populates="batch", cascade="all, delete")

class Investment(Base):
    __tablename__ = "investments"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False)
    units = Column(Integer, default=0)
    amount = Column(Float, default=0.0)
    status = Column(String, default="ACTIVE")  # ACTIVE, EXITED, PAID
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="investments")
    batch = relationship("Batch", back_populates="investments")
    payouts = relationship("Payout", back_populates="investment", cascade="all, delete")

class Payout(Base):
    __tablename__ = "payouts"
    id = Column(Integer, primary_key=True)
    investment_id = Column(Integer, ForeignKey("investments.id"), nullable=False)
    amount = Column(Float, default=0.0)
    kind = Column(String, default="RETURN")  # RETURN, PRINCIPAL, SALVAGE
    created_at = Column(DateTime, default=datetime.utcnow)

    investment = relationship("Investment", back_populates="payouts")

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, default=0.0)
    ttype = Column(String, default="DEPOSIT")  # DEPOSIT, WITHDRAW
    reference = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class FAQ(Base):
    __tablename__ = "faqs"
    id = Column(Integer, primary_key=True)
    question = Column(String, nullable=False)
    answer = Column(Text, nullable=False)

class Page(Base):
    __tablename__ = "pages"
    id = Column(Integer, primary_key=True)
    slug = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=False)
    body_md = Column(Text, nullable=False)
