from fastapi import APIRouter, HTTPException, Depends, status
import os
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ..schemas import Token, UserOut
from ..db import get_db
from .. import models
from .deps import verify_password, create_access_token, get_password_hash, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(
        models.User.username == form_data.username).first()
    if not user:
        # Do not reveal whether user exists; return generic auth error
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    access_token = create_access_token(
        {"sub": user.username, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/refresh", response_model=Token)
def refresh_token(current_user: models.User = Depends(get_current_user)):
    # issue a fresh access token for an authenticated user
    access_token = create_access_token(
        {"sub": current_user.username, "role": current_user.role})
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/register", response_model=Token)
def register(username: str, password: str, role: str = "admin", db: Session = Depends(get_db)):
    """
    Register a new user. Allowed only when no users exist or when ALLOW_REGISTRATION env var is set to 'true'.
    This prevents accidental open registration in production.
    """
    allow = os.getenv("ALLOW_REGISTRATION", "false").lower() == "true"
    existing = db.query(models.User).first()
    if existing and not allow:
        raise HTTPException(status_code=400, detail="Registration disabled")
    if db.query(models.User).filter(models.User.username == username).first():
        raise HTTPException(status_code=400, detail="User already exists")
    hashed = get_password_hash(password)
    user = models.User(username=username, hashed_password=hashed, role=role)
    db.add(user)
    db.commit()
    access_token = create_access_token(
        {"sub": user.username, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get('/me', response_model=UserOut)
def me(current_user: models.User = Depends(get_current_user)):
    """Return the currently authenticated user."""
    return current_user
