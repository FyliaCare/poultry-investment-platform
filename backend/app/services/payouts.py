"""
Batch payout utilities.

- simulate_payout_for_batch: read-only calculation (no DB writes)
- execute_payout_for_batch: create & persist Payout rows, commit, and return them

Assumptions:
  * `Batch` has: .investments (relationship to Investment), .expected_roi (float like 0.15 for 15%)
  * `Investment` has: .id, .amount
  * `Payout` has: id, investment_id, amount, kind, created_at
"""

from __future__ import annotations
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from ..models import Investment, Batch, Payout

# Constants (could move to config)
PAYOUT_KIND_RETURN = "RETURN"


def simulate_payout_for_batch(db: Session, batch: Batch) -> float:
    """
    Compute the total payout value for a batch **without** touching the database.

    Args:
        db: SQLAlchemy Session (unused here but kept for signature consistency)
        batch: a Batch ORM object with populated .investments and .expected_roi

    Returns:
        float: total projected payout for all investments in the batch
    """
    if batch is None:
        raise ValueError("Batch cannot be None")
    if batch.expected_roi is None:
        raise ValueError("Batch.expected_roi must be set")

    total = 0.0
    for inv in batch.investments or []:
        # Guard against nulls / zero amounts
        amt = float(inv.amount or 0.0)
        roi = float(batch.expected_roi)
        total += amt * roi

    return round(total, 2)


def execute_payout_for_batch(
    db: Session,
    batch: Batch,
    roi_override: Optional[float] = None,
) -> List[Payout]:
    """
    Persist payout rows for each investment in the batch and commit.

    Args:
        db: SQLAlchemy Session
        batch: Batch ORM instance with .investments loaded
        roi_override: optional float to override batch.expected_roi

    Returns:
        List[Payout]: newly created and committed payout ORM objects

    Raises:
        ValueError: if batch or expected_roi is missing
        SQLAlchemyError: bubbles up DB errors if commit fails
    """
    if batch is None:
        raise ValueError("Batch cannot be None")
    if roi_override is None and batch.expected_roi is None:
        raise ValueError("ROI not specified on batch and no override given")

    roi = float(roi_override if roi_override is not None else batch.expected_roi)

    created: List[Payout] = []

    try:
        for inv in batch.investments or []:
            amt = float(inv.amount or 0.0)
            if amt <= 0:
                # skip or log invalid investment
                continue

            payout = Payout(
                investment_id=inv.id,
                amount=round(amt * roi, 2),
                kind=PAYOUT_KIND_RETURN,
            )
            db.add(payout)
            created.append(payout)

        db.commit()

        for p in created:
            db.refresh(p)

        return created

    except SQLAlchemyError as e:
        db.rollback()
        # optional: logging.error("Payout execution failed", exc_info=e)
        raise
