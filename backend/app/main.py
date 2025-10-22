from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routers import admin, investors, public
from app import auth
import os

app = FastAPI(title=settings.PROJECT_NAME, version="1.0.0")

origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=settings.API_V1_STR, tags=["Authentication"])
app.include_router(public.router, prefix=settings.API_V1_STR + "/public", tags=["Public"])
app.include_router(investors.router, prefix=settings.API_V1_STR + "/invest", tags=["Investors"])
app.include_router(admin.router, prefix=settings.API_V1_STR + "/admin", tags=["Admin"])

@app.get("/health")
def health():
    return {"ok": True}
