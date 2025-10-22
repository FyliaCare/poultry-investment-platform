from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import jwt, JWTError
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from .database import get_db
from .models import User, Wallet
from .schemas import Token, UserCreate, UserOut

import os

SECRET_KEY = os.getenv("JWT_SECRET", "change_me")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

router = APIRouter(prefix="/auth", tags=["auth"])

def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = int(payload.get("sub"))
    except Exception:
        raise credentials_exception
    user = db.get(User, user_id)
    if not user:
        raise credentials_exception
    return user

@router.post("/register", response_model=UserOut)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name or user_in.email.split("@")[0],
        is_admin=False,
    )
    db.add(user)
    db.flush()
    # create wallet
    wallet = Wallet(user_id=user.id, balance=0.0)
    db.add(wallet)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # DEMO MODE: Auto-create user if they don't exist (REMOVE IN PRODUCTION!)
    user = db.query(User).filter(User.email == form_data.username).first()
    
    if not user:
        # Auto-create demo user
        print(f"[DEMO MODE] Auto-creating user: {form_data.username}")
        user = User(
            email=form_data.username,
            hashed_password=get_password_hash(form_data.password),
            full_name=form_data.username.split("@")[0],
            is_admin=False,
        )
        db.add(user)
        db.flush()
        wallet = Wallet(user_id=user.id, balance=1000.0)  # Demo balance
        db.add(wallet)
        db.commit()
        db.refresh(user)
    elif not verify_password(form_data.password, user.hashed_password):
        # For existing users, still check password
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    token = create_access_token({"sub": str(user.id)})
    return Token(access_token=token)

@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user
