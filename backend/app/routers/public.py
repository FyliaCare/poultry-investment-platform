from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import FAQ, Page, Batch, ProductType
from ..schemas import FAQOut, PageOut, BatchOut
from typing import List
import logging

logger = logging.getLogger("public_router")
router = APIRouter(prefix="/public", tags=["public"])

@router.get("/overview")
def overview(db: Session = Depends(get_db)):
    eggs = db.query(Batch).filter(Batch.product_type == ProductType.EGG).count()
    chicken = db.query(Batch).filter(Batch.product_type == ProductType.CHICKEN).count()
    logger.info(f"Overview stats: eggs={eggs}, chicken={chicken}")
    return {
        "success": True,
        "stats": {
            "batches_egg": eggs,
            "batches_chicken": chicken,
        },
        "highlights": [
            "Transparent returns with live batch tracking",
            "Short cycles on broilers; monthly yields on layers",
            "Escrowed funds and clear governance (demo)",
        ],
    }

@router.get("/products", response_model=List[BatchOut])
def products(db: Session = Depends(get_db)):
    # Show active/planned batches to invest in
    batches = db.query(Batch).filter(Batch.status.in_(["PLANNED", "ACTIVE"])).order_by(Batch.created_at.desc()).all()
    logger.info(f"Listed {len(batches)} products")
    return {"success": True, "products": batches}

@router.get("/faq", response_model=List[FAQOut])
def get_faq(db: Session = Depends(get_db)):
    faqs = db.query(FAQ).all()
    logger.info(f"Listed {len(faqs)} FAQs")
    return {"success": True, "faqs": faqs}

@router.get("/pages/{slug}", response_model=PageOut)
def get_page(slug: str, db: Session = Depends(get_db)):
    page = db.query(Page).filter(Page.slug == slug).first()
    if not page:
        logger.warning(f"Page not found: {slug}")
        return {"success": False, "page": {"slug": slug, "title": "Page", "body_md": "Content coming soon."}}
    logger.info(f"Page found: {slug}")
    return {"success": True, "page": page}
