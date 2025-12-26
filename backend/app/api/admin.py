from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
import datetime

from ..db import get_db
from .. import models, schemas
from .deps import require_any_role, get_current_user

router = APIRouter(prefix="/admin", tags=["admin"])


def require_admin(user: models.User = Depends(require_any_role('admin', 'super_admin'))):
    return user


@router.get('/documents', response_model=list[schemas.UserDocumentOut])
def list_documents(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    qs = db.query(models.UserDocument)
    if status:
        qs = qs.filter(models.UserDocument.status == status)
    return qs.order_by(models.UserDocument.id.desc()).all()


@router.post('/documents/{doc_id}/approve', response_model=schemas.UserDocumentOut)
def approve_document(
    doc_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    doc = db.query(models.UserDocument).filter(models.UserDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail='Document not found')
    doc.status = 'approved'
    doc.rejection_reason = None
    doc.reviewed_at = datetime.datetime.utcnow()
    doc.reviewed_by_user_id = admin.id
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


@router.post('/documents/{doc_id}/reject', response_model=schemas.UserDocumentOut)
def reject_document(
    doc_id: int,
    reason: str,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    doc = db.query(models.UserDocument).filter(models.UserDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail='Document not found')
    doc.status = 'rejected'
    doc.rejection_reason = reason
    doc.reviewed_at = datetime.datetime.utcnow()
    doc.reviewed_by_user_id = admin.id
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


@router.post('/users/{user_id}/activate')
def activate_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    u = db.query(models.User).filter(models.User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail='User not found')

    # For inspectors/admins we require at least one approved document before activation.
    if u.role in ('inspector', 'admin'):
        approved = db.query(models.UserDocument).filter(
            models.UserDocument.user_id == u.id,
            models.UserDocument.status == 'approved',
        ).first()
        if not approved:
            raise HTTPException(status_code=400, detail='No approved documents for this user')

    u.status = 'active'
    u.updated_at = datetime.datetime.utcnow()
    db.add(u)
    db.commit()
    return {'ok': True}
