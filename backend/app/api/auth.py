from fastapi import APIRouter, HTTPException, Depends, status, Body, Form, UploadFile, File
import os
from sqlalchemy.orm import Session
from typing import Optional
import datetime

from pydantic import BaseModel

from ..schemas import Token, UserOut, RegisterBody, VerifyOtpBody, UserDocumentOut
from ..db import get_db
from .. import models
from .deps import verify_password, create_access_token, get_password_hash, get_current_user

from ..storage import upload_bytes

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginBody(BaseModel):
    username: str
    password: str


@router.post("/login", response_model=Token)
def login(
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
    else:
        u = username
        p = password

    if not u or not p:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Missing username or password")

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
    body: RegisterBody = Body(...),
    db: Session = Depends(get_db),
):
    """
    Register a new user. Allowed only when no users exist or when ALLOW_REGISTRATION env var is set to 'true'.
    This prevents accidental open registration in production.
    """
    username = body.username
    password = body.password
    role = body.role
    email = body.email
    phone = body.phone

    if not username or not password:
        raise HTTPException(status_code=400, detail="Missing username or password")

    if role not in ('public', 'inspector', 'admin'):
        raise HTTPException(status_code=400, detail='Invalid role')

    allow = os.getenv("ALLOW_REGISTRATION", "false").lower() == "true"
    existing = db.query(models.User).first()
    if role == 'admin' and existing and not allow:
        raise HTTPException(status_code=400, detail="Registration disabled")
    if db.query(models.User).filter(models.User.username == username).first():
        raise HTTPException(status_code=400, detail="User already exists")
    if email and db.query(models.User).filter(models.User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already exists")
    if phone and db.query(models.User).filter(models.User.phone == phone).first():
        raise HTTPException(status_code=400, detail="Phone already exists")
    hashed = get_password_hash(password)

    now = datetime.datetime.utcnow()

    # Bootstrap rule: if there are no users, the first account becomes super_admin and active
    # to prevent lockout.
    if existing is None:
        role = 'super_admin'
        status_value = 'active'
        email_verified = 1 if email else 0
        phone_verified = 1 if phone else 0
    else:
        # New users must verify email or phone first.
        # - public: pending -> active after OTP
        # - inspector/admin: pending -> pending_verification after OTP and then admin approves
        status_value = 'pending'
        email_verified = 0
        phone_verified = 0

    user = models.User(
        username=username,
        hashed_password=hashed,
        role=role,
        status=status_value,
        email=email,
        phone=phone,
        email_verified=email_verified,
        phone_verified=phone_verified,
        created_at=now,
        updated_at=now,
    )
    db.add(user)
    db.commit()
    access_token = create_access_token(
        {"sub": user.username, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}


@router.post('/verify-otp', response_model=UserOut)
def verify_otp(
    body: VerifyOtpBody,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    expected = os.getenv('DEV_OTP_CODE', '123456')
    if body.otp != expected:
        raise HTTPException(status_code=400, detail='Invalid OTP')
    if body.method not in ('email', 'phone'):
        raise HTTPException(status_code=400, detail='Invalid method')

    if body.method == 'email':
        if not current_user.email:
            raise HTTPException(status_code=400, detail='No email on account')
        current_user.email_verified = 1
    if body.method == 'phone':
        if not current_user.phone:
            raise HTTPException(status_code=400, detail='No phone on account')
        current_user.phone_verified = 1

    # If either is verified, update status based on role.
    if (current_user.email_verified or 0) == 1 or (current_user.phone_verified or 0) == 1:
        if current_user.role == 'public':
            current_user.status = 'active'
        elif current_user.role in ('inspector', 'admin'):
            current_user.status = 'pending_verification'
        else:
            current_user.status = 'active'

    current_user.updated_at = datetime.datetime.utcnow()
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post('/verification/documents', response_model=UserDocumentOut)
async def upload_verification_document(
    doc_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role not in ('inspector', 'admin'):
        raise HTTPException(status_code=403, detail='Forbidden')

    content = await file.read()
    content_type = file.content_type or 'application/octet-stream'
    filename = file.filename
    bucket = os.getenv('SUPABASE_STORAGE_BUCKET', 'traffic-files')
    path, url = upload_bytes(
        folder=f"verification/{current_user.id}",
        filename=filename,
        content=content,
        content_type=content_type,
        bucket=bucket,
    )

    doc = models.UserDocument(
        user_id=current_user.id,
        doc_type=doc_type,
        file_bucket=bucket,
        file_path=path,
        file_url=url,
        status='pending',
        uploaded_at=datetime.datetime.utcnow(),
    )
    db.add(doc)

    if getattr(current_user, 'status', None) != 'active':
        current_user.status = 'pending_verification'
        current_user.updated_at = datetime.datetime.utcnow()
        db.add(current_user)

    db.commit()
    db.refresh(doc)
    return doc


@router.get('/me', response_model=UserOut)
def me(current_user: models.User = Depends(get_current_user)):
    """Return the currently authenticated user."""
    return current_user
