from fastapi import APIRouter, HTTPException, Depends, status, Body, Form
import os
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from ..schemas import Token, UserOut
from ..db import get_db
from .. import models
from .deps import verify_password, create_access_token, get_password_hash, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginBody(BaseModel):
    username: str
    password: str


class RegisterBody(BaseModel):
    username: str
    password: str
    role: str = "admin"


@router.post("/login", response_model=Token)
def login(
    form_data: Optional[OAuth2PasswordRequestForm] = Depends(None),
    body: Optional[LoginBody] = Body(None),
    username: Optional[str] = Form(None),
    password: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    u = None
    p = None
    if body is not None:
        u = body.username
        p = body.password
    elif form_data is not None and getattr(form_data, 'username', None) is not None:
        u = form_data.username
        p = form_data.password
    else:
        u = username
        p = password

    if not u or not p:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing username or password")

    user = db.query(models.User).filter(models.User.username == u).first()
    if not user:
        # Do not reveal whether user exists; return generic auth error
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not verify_password(p, user.hashed_password):
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
def register(
    body: Optional[RegisterBody] = Body(None),
    username: Optional[str] = None,
    password: Optional[str] = None,
    role: str = "admin",
    db: Session = Depends(get_db),
):
    """
    Register a new user. Allowed only when no users exist or when ALLOW_REGISTRATION env var is set to 'true'.
    This prevents accidental open registration in production.
    """
    if body is not None:
        username = body.username
        password = body.password
        role = body.role

    if not username or not password:
        raise HTTPException(status_code=400, detail="Missing username or password")

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
