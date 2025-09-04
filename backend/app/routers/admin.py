from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import logging

from ..database import get_db
from ..models import User
from ..models import Farm, Batch, ProductType, FAQ, Page, User
from ..schemas import FarmIn, FarmOut, BatchIn, BatchOut
from ..services.payouts import simulate_payout_for_batch, execute_payout_for_batch

logger = logging.getLogger("admin_router")
router = APIRouter(prefix="/admin", tags=["admin"])

@router.post("/farms", response_model=FarmOut)
def create_farm(payload: FarmIn, db: Session = Depends(get_db)):
    # Bypass admin login: use first user in DB for development
    user = db.query(User).order_by(User.id.asc()).first()
    try:
        farm = Farm(**payload.dict())
        db.add(farm)
        db.commit()
        db.refresh(farm)
        logger.info(f"Farm created: {farm.id}")
        return {"success": True, "farm": farm}
    except Exception as e:
        logger.error(f"Error creating farm: {e}")
        raise HTTPException(status_code=500, detail="Failed to create farm")

@router.get("/farms", response_model=List[FarmOut])
def list_farms(db: Session = Depends(get_db)):
    user = db.query(User).order_by(User.id.asc()).first()
    farms = db.query(Farm).all()
    logger.info(f"Listed {len(farms)} farms")
    return {"success": True, "farms": farms}

@router.post("/batches", response_model=BatchOut)
def create_batch(payload: BatchIn, db: Session = Depends(get_db)):
    user = db.query(User).order_by(User.id.asc()).first()
    try:
        ptype = ProductType[payload.product_type.upper()]
        b = Batch(
            farm_id=payload.farm_id,
            product_type=ptype,
            unit_price=payload.unit_price,
            target_units=payload.target_units,
            feed_price=payload.feed_price,
            mortality_rate=payload.mortality_rate,
            expected_roi=payload.expected_roi,
            status="PLANNED",
        )
        db.add(b)
        db.commit()
        db.refresh(b)
        logger.info(f"Batch created: {b.id}")
        return {"success": True, "batch": b}
    except KeyError:
        logger.warning("Invalid product type")
        raise HTTPException(status_code=400, detail="Invalid product type")
    except Exception as e:
        logger.error(f"Error creating batch: {e}")
        raise HTTPException(status_code=500, detail="Failed to create batch")

@router.get("/batches", response_model=List[BatchOut])
def list_batches(db: Session = Depends(get_db)):
    user = db.query(User).order_by(User.id.asc()).first()
    batches = db.query(Batch).all()
    logger.info(f"Listed {len(batches)} batches")
    return {"success": True, "batches": batches}

@router.post("/batches/{batch_id}/activate")
def activate_batch(batch_id: int, db: Session = Depends(get_db)):
    user = db.query(User).order_by(User.id.asc()).first()
    b = db.get(Batch, batch_id)
    if not b:
        logger.warning(f"Batch not found: {batch_id}")
        raise HTTPException(status_code=404, detail="Batch not found")
    b.status = "ACTIVE"
    db.commit()
    logger.info(f"Batch activated: {batch_id}")
    return {"success": True, "batch_id": batch_id}

@router.post("/batches/{batch_id}/harvest")
def harvest_batch(batch_id: int, db: Session = Depends(get_db)):
    user = db.query(User).order_by(User.id.asc()).first()
    b = db.get(Batch, batch_id)
    if not b:
        logger.warning(f"Batch not found: {batch_id}")
        raise HTTPException(status_code=404, detail="Batch not found")
    b.status = "HARVESTED"
    db.commit()
    logger.info(f"Batch harvested: {batch_id}")
    return {"success": True, "batch_id": batch_id}

@router.get("/payouts/{batch_id}/simulate")
def simulate(batch_id: int, db: Session = Depends(get_db)):
    user = db.query(User).order_by(User.id.asc()).first()
    b = db.get(Batch, batch_id)
    if not b:
        logger.warning(f"Batch not found: {batch_id}")
        raise HTTPException(status_code=404, detail="Batch not found")
    total = simulate_payout_for_batch(db, b)
    logger.info(f"Simulated payout for batch {batch_id}: {total}")
    return {"success": True, "batch_id": batch_id, "simulated_total": total}

@router.post("/payouts/{batch_id}/execute")
def execute(batch_id: int, db: Session = Depends(get_db)):
    user = db.query(User).order_by(User.id.asc()).first()
    b = db.get(Batch, batch_id)
    if not b:
        logger.warning(f"Batch not found: {batch_id}")
        raise HTTPException(status_code=404, detail="Batch not found")
    payouts = execute_payout_for_batch(db, b)
    logger.info(f"Executed payout for batch {batch_id}: {len(payouts)} payouts")
    return {"success": True, "count": len(payouts)}

@router.post("/seed")
def seed(db: Session = Depends(get_db)):
    user = db.query(User).order_by(User.id.asc()).first()
    try:
        # Make first user admin if exists
        first_user = db.query(User).order_by(User.id.asc()).first()
        if first_user:
            first_user.is_admin = True
        # FAQs
        if db.query(FAQ).count() == 0:
            faqs = [
                FAQ(question="How do I earn?", answer="Choose a product (Egg or Chicken), fund via wallet, and receive returns per cycle."),
                FAQ(question="Is my capital guaranteed?", answer="No. Returns depend on farm performance and market prices. We manage risks with SOPs, reserves, and audits."),
                FAQ(question="When are payouts made?", answer="Broilers: at harvest per 7–8 week cycle. Layers: monthly during production."),
            ]
            db.add_all(faqs)
        # Pages
        from textwrap import dedent
        home = dedent("""# Turn Everyday Protein Demand Into Real Yield
Welcome! We connect everyday investors to vetted poultry farms through two products:
    **Egg Note (Layers):** Monthly yield during lay cycle.
    **Chicken Note (Broilers):** Short 7–8 week cycles with lump-sum returns.

We use strict farm SOPs, transparent reporting, and ring-fenced funds to protect your capital and deliver consistent outcomes.
""")
        how = dedent("""# How It Works
1. **Create an account** and complete KYC.
2. **Deposit** into your wallet.
3. **Choose a product**: Egg Note (monthly yield) or Chicken Note (short cycles).
4. **Invest in a live batch** and track progress on your dashboard.
5. **Get paid** at harvest or monthly; reinvest or withdraw.
""")
        if db.query(Page).count() == 0:
            db.add_all([
                Page(slug="home", title="Welcome", body_md=home),
                Page(slug="how-it-works", title="How It Works", body_md=how),
            ])
        db.commit()
        logger.info("Seeded demo content and set first user as admin")
        return {"success": True}
    except Exception as e:
        logger.error(f"Error seeding demo content: {e}")
        raise HTTPException(status_code=500, detail="Failed to seed demo content")
