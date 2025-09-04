from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .database import Base, engine
from . import models
from .auth import router as auth_router
from .routers.public import router as public_router
from .routers.investors import router as investor_router
from .routers.admin import router as admin_router
import os

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Poultry Investment Platform API", version="0.1.0")

origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(public_router, prefix="/api/v1/public", tags=["Public"])
app.include_router(investor_router, prefix="/api/v1/invest", tags=["Investors"])
app.include_router(admin_router, prefix="/api/v1/admin", tags=["Admin"])

@app.get("/health")
def health():
    return {"ok": True}
