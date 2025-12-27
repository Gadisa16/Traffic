from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Body, Request
from sqlalchemy.orm import Session
from typing import Optional
import json
import datetime

from ..db import get_db
from .. import models, schemas
from .deps import require_any_role

from ..storage import upload_bytes

router = APIRouter(prefix="/inspections", tags=["inspections"])


def _parse_when(when: Optional[str]) -> Optional[datetime.datetime]:
    if not when:
        return None
    s = str(when).strip()
    if not s:
        return None
    # accept milliseconds timestamp
    try:
        if s.isdigit():
            return datetime.datetime.fromtimestamp(float(s) / 1000.0)
    except Exception:
        pass
    # accept isoformat
    try:
        return datetime.datetime.fromisoformat(s)
    except Exception:
        return None


@router.post("/", response_model=schemas.InspectionOut)
async def create_inspection(
    payload: Optional[schemas.InspectionCreate] = Body(None),
    code: Optional[str] = Form(None),
    when: Optional[str] = Form(None),
    action: Optional[str] = Form(None),
    note: Optional[str] = Form(None),
    extra_payload: Optional[str] = Form(None, alias="payload"),
    photo: Optional[UploadFile] = File(None),
    request: Request = None,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_any_role("admin", "inspector")),
):
    raw_extra = None

    # If this request is JSON, FastAPI won't populate Body(...) because we also have Form/File params.
    # Detect JSON and parse manually.
    if payload is None and not code:
        try:
            ctype = (request.headers.get('content-type') if request else '') or ''
            if 'application/json' in ctype:
                data = await request.json()
                payload = schemas.InspectionCreate(**(data or {}))
        except Exception:
            payload = None

    if payload is not None:
        code = payload.code
        action = payload.action
        note = payload.note
        when_dt = _parse_when(payload.when)
        raw_extra = payload.payload
    else:
        if not code:
            raise HTTPException(status_code=400, detail="Missing code")
        when_dt = _parse_when(when)
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
        content = await photo.read()
        content_type = photo.content_type or 'application/octet-stream'
        filename = photo.filename
        _, photo_url = upload_bytes(
            bucket='vehicle-photos',
            folder=f"vehicle-{v.id}/inspections",
            filename=filename,
            content=content,
            content_type=content_type,
        )

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
