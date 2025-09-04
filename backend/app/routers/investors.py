from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..auth import get_current_user
from ..models import User, Wallet, Investment, Batch
from ..schemas import InvestmentIn, InvestmentOut, PayoutOut

router = APIRouter(prefix="/invest", tags=["investor"])

@router.get("/wallet")
def wallet(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    w = db.query(Wallet).filter(Wallet.user_id == current_user.id).first()
    return {"balance": w.balance if w else 0.0}

@router.post("/deposit")
def deposit(amount: float, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    w = db.query(Wallet).filter(Wallet.user_id == current_user.id).first()
    if not w:
        raise HTTPException(status_code=400, detail="Wallet missing")
    w.balance += amount
    db.commit()
    return {"ok": True, "balance": w.balance}

@router.post("/create", response_model=InvestmentOut)
def create_investment(payload: InvestmentIn, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    batch = db.get(Batch, payload.batch_id)
    if not batch or batch.status not in ["PLANNED", "ACTIVE"]:
        raise HTTPException(status_code=400, detail="Batch not available")
    amount = batch.unit_price * payload.units
    w = db.query(Wallet).filter(Wallet.user_id == current_user.id).first()
    if not w or w.balance < amount:
        raise HTTPException(status_code=400, detail="Insufficient wallet balance")
    w.balance -= amount
    inv = Investment(user_id=current_user.id, batch_id=batch.id, units=payload.units, amount=amount)
    batch.units_placed += payload.units
    db.add(inv)
    db.commit()
    db.refresh(inv)
    return inv

@router.get("/my", response_model=List[InvestmentOut])
def my_investments(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Investment).filter(Investment.user_id == current_user.id).order_by(Investment.created_at.desc()).all()

@router.get("/payouts/{investment_id}", response_model=List[PayoutOut])
def my_payouts(investment_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    inv = db.get(Investment, investment_id)
    if not inv or inv.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Investment not found")
    return inv.payouts
