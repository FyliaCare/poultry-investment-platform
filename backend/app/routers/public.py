from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import FAQ, Page, Batch, ProductType
from ..schemas import FAQOut, PageOut, BatchOut
from typing import List

router = APIRouter(prefix="/public", tags=["public"])

@router.get("/overview")
def overview(db: Session = Depends(get_db)):
    eggs = db.query(Batch).filter(Batch.product_type == ProductType.EGG).count()
    chicken = db.query(Batch).filter(Batch.product_type == ProductType.CHICKEN).count()
    return {
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
    q = db.query(Batch).filter(Batch.status.in_(["PLANNED", "ACTIVE"])).order_by(Batch.created_at.desc()).all()
    return q

@router.get("/faq", response_model=List[FAQOut])
def get_faq(db: Session = Depends(get_db)):
    return db.query(FAQ).all()

@router.get("/pages/{slug}", response_model=PageOut)
def get_page(slug: str, db: Session = Depends(get_db)):
    page = db.query(Page).filter(Page.slug == slug).first()
    if not page:
        return PageOut(slug=slug, title="Page", body_md="Content coming soon.")
    return page
