from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import logging

from ..database import get_db
from ..models import User
from ..models import User, Wallet, Investment, Batch
from ..schemas import InvestmentIn, InvestmentOut, PayoutOut

logger = logging.getLogger("investors_router")
router = APIRouter(prefix="/invest", tags=["investor"])

@router.get("/wallet")
def wallet(db: Session = Depends(get_db)):
    # Bypass login: use first user in DB for development
    user = db.query(User).order_by(User.id.asc()).first()
    if not user:
        return {"success": False, "balance": 0.0}
    w = db.query(Wallet).filter(Wallet.user_id == user.id).first()
    balance = w.balance if w else 0.0
    logger.info(f"User {user.id} wallet balance: {balance}")
    return {"success": True, "balance": balance}

@router.post("/deposit")
def deposit(amount: float, db: Session = Depends(get_db)):
    user = db.query(User).order_by(User.id.asc()).first()
    if not user:
        return {"success": False, "balance": 0.0}
    if amount <= 0:
        logger.warning(f"User {user.id} tried to deposit non-positive amount: {amount}")
        raise HTTPException(status_code=400, detail="Amount must be positive")
    w = db.query(Wallet).filter(Wallet.user_id == user.id).first()
    if not w:
        logger.warning(f"User {user.id} wallet missing")
        raise HTTPException(status_code=400, detail="Wallet missing")
    w.balance += amount
    db.commit()
    logger.info(f"User {user.id} deposited {amount}, new balance: {w.balance}")
    return {"success": True, "balance": w.balance}

@router.post("/create", response_model=InvestmentOut)
def create_investment(payload: InvestmentIn, db: Session = Depends(get_db)):
    user = db.query(User).order_by(User.id.asc()).first()
    if not user:
        return {"success": False, "investment": None}
    try:
        batch = db.get(Batch, payload.batch_id)
        if not batch or batch.status not in ["PLANNED", "ACTIVE"]:
            logger.warning(f"Batch not available for investment: {payload.batch_id}")
            raise HTTPException(status_code=400, detail="Batch not available")
        amount = batch.unit_price * payload.units
        w = db.query(Wallet).filter(Wallet.user_id == user.id).first()
        if not w or w.balance < amount:
            logger.warning(f"User {user.id} has insufficient wallet balance")
            raise HTTPException(status_code=400, detail="Insufficient wallet balance")
        w.balance -= amount
        inv = Investment(user_id=user.id, batch_id=batch.id, units=payload.units, amount=amount)
        batch.units_placed += payload.units
        db.add(inv)
        db.commit()
        db.refresh(inv)
        logger.info(f"User {user.id} invested {amount} in batch {batch.id}")
        return {"success": True, "investment": inv}
    except Exception as e:
        logger.error(f"Error creating investment: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create investment")

@router.get("/my", response_model=List[InvestmentOut])
def my_investments(db: Session = Depends(get_db)):
    user = db.query(User).order_by(User.id.asc()).first()
    if not user:
        return {"success": False, "investments": []}
    investments = db.query(Investment).filter(Investment.user_id == user.id).order_by(Investment.created_at.desc()).all()
    logger.info(f"User {user.id} listed {len(investments)} investments")
    return {"success": True, "investments": investments}

@router.get("/payouts/{investment_id}", response_model=List[PayoutOut])
def my_payouts(investment_id: int, db: Session = Depends(get_db)):
    user = db.query(User).order_by(User.id.asc()).first()
    if not user:
        return {"success": False, "payouts": []}
    inv = db.get(Investment, investment_id)
    if not inv or inv.user_id != user.id:
        logger.warning(f"User {user.id} tried to access payout for investment {investment_id} not owned")
        raise HTTPException(status_code=404, detail="Investment not found")
    logger.info(f"User {user.id} listed payouts for investment {investment_id}")
    return {"success": True, "payouts": inv.payouts}
