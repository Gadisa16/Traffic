from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional
import os

from ..db import get_db
from sqlalchemy.orm import Session
from .. import models

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(
        models.User.username == username).first()
    if user is None:
        raise credentials_exception
    return user


def get_current_user_optional(token: Optional[str] = Depends(oauth2_scheme_optional), db: Session = Depends(get_db)):
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
    except JWTError:
        return None
    return db.query(models.User).filter(models.User.username == username).first()


def require_status(*statuses: str):
    def status_checker(user: models.User = Depends(get_current_user)):
        s = getattr(user, 'status', None) or 'active'
        if s not in statuses:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Account not active")
        return user

    return status_checker


def require_role(role: str):
    def role_checker(user: models.User = Depends(get_current_user)):
        s = getattr(user, 'status', None) or 'active'
        # Unverified admins can log in but have read-only access
        if s not in ('active', 'unverified_admin'):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Account not active")
        if user.role != role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
        return user

    return role_checker


def require_any_role(*roles: str):
    def role_checker(user: models.User = Depends(get_current_user)):
        s = getattr(user, 'status', None) or 'active'
        # Unverified admins can log in but have read-only access
        if s not in ('active', 'unverified_admin'):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Account not active")
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
        return user

    return role_checker


def require_verified_admin():
    """Require an active (verified) admin or super_admin. Blocks unverified_admin."""
    def checker(user: models.User = Depends(get_current_user)):
        if user.role not in ('admin', 'super_admin'):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
        if user.status != 'active':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Your admin account must be verified to perform this action")
        return user
    return checker
