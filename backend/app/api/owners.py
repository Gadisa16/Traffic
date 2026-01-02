from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from datetime import datetime
from ..db import get_db
from .deps import get_password_hash, require_any_role, get_current_user

router = APIRouter(prefix="/owners", tags=["owners"])


@router.get("/{owner_id}/documents", response_model=list[schemas.OwnerDocumentOut])
def list_owner_documents(owner_id: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    owner = db.query(models.Owner).filter(models.Owner.id == owner_id).first()
    if not owner:
        raise HTTPException(status_code=404, detail="Owner not found")
    return owner.documents


@router.post("/{owner_id}/documents", response_model=schemas.OwnerDocumentOut)
def upload_owner_document(owner_id: int, payload: schemas.OwnerDocumentCreate, db: Session = Depends(get_db), user: models.User = Depends(require_any_role('admin', 'super_admin'))):
    owner = db.query(models.Owner).filter(models.Owner.id == owner_id).first()
    if not owner:
        raise HTTPException(status_code=404, detail="Owner not found")
    doc = models.OwnerDocument(
        owner_id=owner_id,
        doc_type=payload.doc_type,
        file_url=payload.file_url,
        file_bucket=payload.file_bucket or '',
        file_path=payload.file_path or '',
        status='pending',
        uploaded_at=datetime.utcnow(),
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


@router.get("/", response_model=list[schemas.OwnerOut])
def list_owners(db: Session = Depends(get_db), user: models.User = Depends(require_any_role('admin', 'super_admin'))):
    qs = db.query(models.Owner).all()
    return qs


@router.post("/", response_model=schemas.OwnerOut)
def create_owner(payload: schemas.OwnerCreate, db: Session = Depends(get_db), user: models.User = Depends(require_any_role('admin', 'super_admin'))):
    national_hash = None
    if getattr(payload, 'national_id', None):
        import hashlib
        national_hash = hashlib.sha256(
            payload.national_id.encode()).hexdigest()
    o = models.Owner(
        full_name=payload.full_name,
        phone=payload.phone,
        address=payload.address,
        tin_number=getattr(payload, 'tin_number', None),
        fan_number=getattr(payload, 'fan_number', None),
        national_id_hash=national_hash,
    )
    db.add(o)
    db.commit()
    db.refresh(o)
    return o


@router.get("/{owner_id}", response_model=schemas.OwnerOut)
def get_owner(owner_id: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    o = db.query(models.Owner).filter(models.Owner.id == owner_id).first()
    if not o:
        raise HTTPException(status_code=404, detail="Owner not found")
    return o


@router.put("/{owner_id}", response_model=schemas.OwnerOut)
def update_owner(owner_id: int, payload: schemas.OwnerCreate, db: Session = Depends(get_db), user: models.User = Depends(require_any_role('admin', 'super_admin'))):
    o = db.query(models.Owner).filter(models.Owner.id == owner_id).first()
    if not o:
        raise HTTPException(status_code=404, detail="Owner not found")
    o.full_name = payload.full_name
    o.phone = payload.phone
    o.address = payload.address
    o.tin_number = getattr(payload, 'tin_number', None)
    o.fan_number = getattr(payload, 'fan_number', None)
    if getattr(payload, 'national_id', None):
        import hashlib
        o.national_id_hash = hashlib.sha256(
            payload.national_id.encode()).hexdigest()
    db.add(o)
    db.commit()
    db.refresh(o)
    return o


@router.delete("/{owner_id}")
def delete_owner(owner_id: int, db: Session = Depends(get_db), user: models.User = Depends(require_any_role('admin', 'super_admin'))):
    o = db.query(models.Owner).filter(models.Owner.id == owner_id).first()
    if not o:
        raise HTTPException(status_code=404, detail="Owner not found")
    # only allow deletion if no vehicles are associated
    if o.vehicles:
        raise HTTPException(
            status_code=400, detail="Owner has associated vehicles")
    db.delete(o)
    db.commit()
    return {"ok": True}
