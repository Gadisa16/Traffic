from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from ..db import get_db
from .deps import get_password_hash, require_role, get_current_user

router = APIRouter(prefix="/owners", tags=["owners"])


@router.get("/", response_model=list[schemas.OwnerOut])
def list_owners(db: Session = Depends(get_db), user: models.User = Depends(require_role('admin'))):
    qs = db.query(models.Owner).all()
    return qs


@router.post("/", response_model=schemas.OwnerOut)
def create_owner(payload: schemas.OwnerCreate, db: Session = Depends(get_db), user: models.User = Depends(require_role('admin'))):
    national_hash = None
    if getattr(payload, 'national_id', None):
        import hashlib
        national_hash = hashlib.sha256(
            payload.national_id.encode()).hexdigest()
    o = models.Owner(full_name=payload.full_name, phone=payload.phone,
                     address=payload.address, national_id_hash=national_hash)
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
def update_owner(owner_id: int, payload: schemas.OwnerCreate, db: Session = Depends(get_db), user: models.User = Depends(require_role('admin'))):
    o = db.query(models.Owner).filter(models.Owner.id == owner_id).first()
    if not o:
        raise HTTPException(status_code=404, detail="Owner not found")
    o.full_name = payload.full_name
    o.phone = payload.phone
    o.address = payload.address
    if getattr(payload, 'national_id', None):
        import hashlib
        o.national_id_hash = hashlib.sha256(
            payload.national_id.encode()).hexdigest()
    db.add(o)
    db.commit()
    db.refresh(o)
    return o


@router.delete("/{owner_id}")
def delete_owner(owner_id: int, db: Session = Depends(get_db), user: models.User = Depends(require_role('admin'))):
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
