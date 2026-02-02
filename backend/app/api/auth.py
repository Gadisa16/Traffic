from fastapi import APIRouter, HTTPException, Depends, status, Body, Form, UploadFile, File, Request
import os
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
import datetime

from pydantic import BaseModel

from ..schemas import Token, UserOut, RegisterBody, VerifyOtpBody, UserDocumentOut, AdminRegisterBody, AdminVerificationBody
from ..db import get_db
from .. import models
from .deps import verify_password, create_access_token, get_password_hash, get_current_user

from ..storage import upload_bytes

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginBody(BaseModel):
    username: str
    password: str


@router.post("/login", response_model=Token)
async def login(
    body: Optional[LoginBody] = Body(None),
    username: Optional[str] = Form(None),
    password: Optional[str] = Form(None),
    request: Request = None,
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

    if (not u or not p) and request is not None:
        try:
            ctype = (request.headers.get('content-type') or '').lower()
            if 'application/json' in ctype:
                data = await request.json()
                if isinstance(data, dict):
                    u = u or data.get('username')
                    p = p or data.get('password')
        except Exception:
            pass

    if not u or not p:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Missing username or password")

    user = db.query(models.User).filter(
        or_(models.User.username == u, models.User.email == u)
    ).first()
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


@router.get("/me", response_model=UserOut)
def me(current_user: models.User = Depends(get_current_user)):
    return current_user


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
    Register a new user with admin signup & verification rules:
    - Mobile registrations can NEVER create admins (only public/inspector)
    - Admin signup allowed only if ALLOW_ADMIN_REGISTRATION=true
    - First admin becomes super_admin automatically
    - Subsequent admins become unverified_admin (read-only until verified)
    """
    username = body.username
    password = body.password
    role = body.role
    email = body.email
    phone = body.phone

    if not username or not password:
        raise HTTPException(status_code=400, detail="Missing username or password")

    if not email or not phone:
        raise HTTPException(status_code=400, detail="Email and phone are required")

    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password too short")

    # Mobile registrations can NEVER create admins
    if role not in ('public', 'inspector'):
        raise HTTPException(status_code=400, detail='Invalid role. Mobile registrations can only create public or inspector accounts.')

    # Check if any users exist
    any_user_exists = db.query(models.User).first() is not None
    
    # Check for duplicate username/email/phone
    if db.query(models.User).filter(models.User.username == username).first():
        raise HTTPException(status_code=400, detail="User already exists")
    if email and db.query(models.User).filter(models.User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already exists")
    if phone and db.query(models.User).filter(models.User.phone == phone).first():
        raise HTTPException(status_code=400, detail="Phone already exists")
    
    hashed = get_password_hash(password)
    now = datetime.datetime.utcnow()

    # Bootstrap rule: if there are no users yet, activate the first account immediately
    # (so the system is usable), but keep the requested role (public/inspector).
    if not any_user_exists:
        status_value = 'active'
        email_verified = 1 if email else 0
        phone_verified = 1 if phone else 0
    else:
        # New users must verify email or phone first.
        # - public: pending -> active after OTP
        # - inspector: pending -> pending_verification after OTP and then admin approves
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
    if current_user.role not in ('inspector', 'admin', 'super_admin'):
        raise HTTPException(status_code=403, detail='Forbidden')

    content = await file.read()
    content_type = file.content_type or 'application/octet-stream'
    filename = file.filename
    bucket = 'inspector-docs'
    path, url = upload_bytes(
        bucket=bucket,
        folder=f"user-{current_user.id}",
        filename=filename,
        content=content,
        content_type=content_type,
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


@router.post('/admin/register', response_model=Token)
def register_admin(
    body: AdminRegisterBody = Body(...),
    db: Session = Depends(get_db),
):
    """
    Admin registration endpoint (web-only).
    - Requires ALLOW_ADMIN_REGISTRATION=true in .env
    - First admin becomes super_admin automatically
    - Subsequent admins become unverified_admin (read-only until verified)
    """
    # Check if admin registration is allowed
    allow_admin_reg = os.getenv("ALLOW_ADMIN_REGISTRATION", "false").lower() == "true"
    if not allow_admin_reg:
        raise HTTPException(status_code=403, detail="Admin registration is disabled. Set ALLOW_ADMIN_REGISTRATION=true to enable.")
    
    username = body.username
    password = body.password
    email = body.email
    phone = body.phone

    if not username or not password:
        raise HTTPException(status_code=400, detail="Missing username or password")

    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password too short")

    # Check for duplicates
    if db.query(models.User).filter(models.User.username == username).first():
        raise HTTPException(status_code=400, detail="User already exists")
    if email and db.query(models.User).filter(models.User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already exists")
    if phone and db.query(models.User).filter(models.User.phone == phone).first():
        raise HTTPException(status_code=400, detail="Phone already exists")
    
    hashed = get_password_hash(password)
    now = datetime.datetime.utcnow()

    # Check if any super_admin exists
    super_admin_exists = db.query(models.User).filter(models.User.role == 'super_admin').first() is not None
    
    if not super_admin_exists:
        # First admin becomes super_admin automatically
        role = 'super_admin'
        status_value = 'active'
    else:
        # Subsequent admins become unverified_admin
        role = 'admin'
        status_value = 'unverified_admin'
    
    user = models.User(
        username=username,
        hashed_password=hashed,
        role=role,
        status=status_value,
        email=email,
        phone=phone,
        email_verified=1 if email else 0,
        phone_verified=1 if phone else 0,
        created_at=now,
        updated_at=now,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    access_token = create_access_token(
        {"sub": user.username, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get('/admin/unverified', response_model=list[UserOut])
def list_unverified_admins(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    List all unverified admin accounts.
    Only accessible by verified admins or super_admins.
    """
    if current_user.role not in ('admin', 'super_admin'):
        raise HTTPException(status_code=403, detail="Forbidden")
    
    if current_user.status != 'active':
        raise HTTPException(status_code=403, detail="Your account must be active to manage users")
    
    unverified = db.query(models.User).filter(
        models.User.status == 'unverified_admin'
    ).all()
    
    return unverified


@router.post('/admin/verify', response_model=UserOut)
def verify_admin(
    body: AdminVerificationBody = Body(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Approve or reject an unverified admin account.
    Only accessible by verified admins or super_admins.
    """
    if current_user.role not in ('admin', 'super_admin'):
        raise HTTPException(status_code=403, detail="Forbidden")
    
    if current_user.status != 'active':
        raise HTTPException(status_code=403, detail="Your account must be active to manage users")
    
    target_user = db.query(models.User).filter(models.User.id == body.user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if target_user.status != 'unverified_admin':
        raise HTTPException(status_code=400, detail="User is not an unverified admin")
    
    if body.approved:
        # Approve: make them an active admin
        target_user.status = 'active'
        target_user.updated_at = datetime.datetime.utcnow()
    else:
        # Reject: disable the account
        target_user.status = 'rejected'
        target_user.updated_at = datetime.datetime.utcnow()
    
    db.add(target_user)
    db.commit()
    db.refresh(target_user)
    
    return target_user


@router.get('/me', response_model=UserOut)
def me(current_user: models.User = Depends(get_current_user)):
    """Return the currently authenticated user."""
    return current_user
