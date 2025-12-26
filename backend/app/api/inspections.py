from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Body
from sqlalchemy.orm import Session
from typing import Optional
import os
import json
import datetime
import uuid

from ..db import get_db
from .. import models, schemas
from .deps import get_current_user, require_any_role

router = APIRouter(prefix="/inspections", tags=["inspections"])


def _uploads_root() -> str:
    here = os.path.dirname(os.path.dirname(__file__))
    # backend/app/api -> backend/app -> backend
    backend_root = os.path.dirname(here)
    return os.path.join(backend_root, "uploads")


def _ensure_dir(p: str) -> None:
    os.makedirs(p, exist_ok=True)


def _save_upload(file: UploadFile, subdir: str) -> str:
    root = _uploads_root()
    target_dir = os.path.join(root, subdir)
    _ensure_dir(target_dir)

    ext = os.path.splitext(file.filename or "")[1] or ".jpg"
    name = f"{uuid.uuid4().hex}{ext}"
    abs_path = os.path.join(target_dir, name)

    with open(abs_path, "wb") as out:
        out.write(file.file.read())

    rel = os.path.relpath(abs_path, root).replace("\\", "/")
    return f"/uploads/{rel}"


@router.post("/", response_model=schemas.InspectionOut)
def create_inspection(
    payload: Optional[schemas.InspectionCreate] = Body(None),
    code: Optional[str] = Form(None),
    when: Optional[str] = Form(None),
    action: Optional[str] = Form(None),
    note: Optional[str] = Form(None),
    extra_payload: Optional[str] = Form(None, alias="payload"),
    photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    user: models.User = Depends(require_any_role("admin", "inspector")),
):
    if payload is not None:
        code = payload.code
        action = payload.action
        note = payload.note
        when_dt = payload.when
        raw_extra = payload.payload
    else:
        if not code:
            raise HTTPException(status_code=400, detail="Missing code")
        when_dt = None
        if when:
            try:
                when_dt = datetime.datetime.fromtimestamp(float(when) / 1000.0)
            except Exception:
                when_dt = None
        raw_extra = None
        if extra_payload:
            try:
                raw_extra = json.loads(extra_payload)
            except Exception:
                raw_extra = {"raw": extra_payload}

    v = db.query(models.Vehicle).filter(models.Vehicle.is_deleted == 0).filter(
        (models.Vehicle.qr_value == code) |
        (models.Vehicle.plate_number == code) |
        (models.Vehicle.side_number == code)
    ).first()

    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    photo_url = None
    if photo is not None:
        photo_url = _save_upload(photo, "inspections")

    ins = models.Inspection(
        vehicle_id=v.id,
        code=code,
        inspector_username=user.username,
        action=action,
        note=note,
        payload_json=json.dumps(raw_extra) if raw_extra is not None else None,
        photo_url=photo_url,
        inspected_at=when_dt,
        created_at=datetime.datetime.utcnow(),
    )
    db.add(ins)
    db.commit()
    db.refresh(ins)
    return ins
