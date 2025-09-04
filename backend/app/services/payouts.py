from sqlalchemy.orm import Session
from ..models import Investment, Batch, ProductType, Payout

def simulate_payout_for_batch(db: Session, batch: Batch):
    """Very simple demo simulation:
    - For CHICKEN: one-off ROI based on expected_roi against amount.
    - For EGG: monthly-style payout ~ expected_roi * amount / month (but here we just do one payout for demo).
    """
    total = 0.0
    for inv in batch.investments:
        roi = batch.expected_roi
        amount = inv.amount * roi
        total += amount
    return total

def execute_payout_for_batch(db: Session, batch: Batch):
    created = []
    for inv in batch.investments:
        amount = inv.amount * batch.expected_roi
        p = Payout(investment_id=inv.id, amount=amount, kind="RETURN")
        db.add(p)
        created.append(p)
    db.commit()
    for c in created:
        db.refresh(c)
    return created
