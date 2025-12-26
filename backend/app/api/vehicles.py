from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from .. import models, schemas
from ..db import get_db
import hashlib
from .deps import get_current_user, require_role, require_any_role
from datetime import date, timedelta
import os
import uuid

import qrcode

router = APIRouter(prefix="/vehicles", tags=["vehicles"])


def _uploads_root() -> str:
    here = os.path.dirname(os.path.dirname(__file__))
    backend_root = os.path.dirname(here)
    return os.path.join(backend_root, "uploads")


def _mask_phone(phone: Optional[str]) -> Optional[str]:
    if not phone:
        return None
    p = str(phone)
    if len(p) <= 3:
        return "***"
    return f"***{p[-3:]}"


def _license_expiry_str(v: models.Vehicle) -> Optional[str]:
    try:
        if v.license and v.license.expiry_date:
            return v.license.expiry_date.isoformat()
    except Exception:
        return None
    return None


@router.get("/verify", response_model=schemas.VehicleVerifyOut)
def verify_vehicle(
    code: str = Query(..., description="QR value, plate number, or side number"),
    db: Session = Depends(get_db),
    user: models.User = Depends(require_any_role('admin', 'inspector')),
):
    v = db.query(models.Vehicle).options(joinedload(models.Vehicle.owner), joinedload(models.Vehicle.license)).filter(
        models.Vehicle.is_deleted == 0,
        (
            (models.Vehicle.qr_value == code) |
            (models.Vehicle.plate_number == code) |
            (models.Vehicle.side_number == code)
        )
    ).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    owner = None
    if v.owner:
        owner = {
            "name": v.owner.full_name,
            "mask_phone": _mask_phone(v.owner.phone),
        }

    return {
        "plate_number": v.plate_number,
        "side_number": v.side_number,
        "status": str(v.status.value if hasattr(v.status, 'value') else v.status),
        "license_expiry": _license_expiry_str(v),
        "owner": owner,
        "qr_value": v.qr_value,
    }


@router.get("/qr/{qr_value}.png")
def get_qr_png(qr_value: str):
    path = os.path.join(_uploads_root(), "qr", f"{qr_value}.png")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="QR image not found")
    return FileResponse(path, media_type="image/png")


@router.post("/{vehicle_id}/qr", response_model=schemas.VehicleQrOut)
def generate_vehicle_qr(
    vehicle_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role('admin')),
):
    v = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id, models.Vehicle.is_deleted == 0).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    if not v.qr_value:
        v.qr_value = uuid.uuid4().hex
        db.add(v)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise HTTPException(status_code=400, detail="Failed to generate QR value")
        db.refresh(v)

    root = _uploads_root()
    qr_dir = os.path.join(root, "qr")
    os.makedirs(qr_dir, exist_ok=True)
    png_path = os.path.join(qr_dir, f"{v.qr_value}.png")

    if not os.path.exists(png_path):
        img = qrcode.make(v.qr_value)
        img.save(png_path)

    return {
        "vehicle_id": v.id,
        "qr_value": v.qr_value,
        "qr_png_url": f"/uploads/qr/{v.qr_value}.png",
    }


@router.get("/", response_model=list[schemas.VehicleOut])
def list_vehicles(
    plate: Optional[str] = Query(
        None, description="Filter by plate (substring, case-insensitive)"),
    side: Optional[str] = Query(
        None, description="Filter by exact side number"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """List vehicles. Optional query params:
    - `plate`: substring match (case-insensitive)
    - `side`: exact 4-digit side number
    """
    qs = db.query(models.Vehicle).options(joinedload(models.Vehicle.owner), joinedload(
        models.Vehicle.license)).filter(models.Vehicle.is_deleted == 0)
    if plate:
        # case-insensitive substring match
        try:
            qs = qs.filter(models.Vehicle.plate_number.ilike(f"%{plate}%"))
        except Exception:
            qs = qs.filter(models.Vehicle.plate_number.contains(plate))
    if side:
        qs = qs.filter(models.Vehicle.side_number == side)
    return qs.all()


@router.get("/{vehicle_id}", response_model=schemas.VehicleOut)
def get_vehicle(vehicle_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    v = db.query(models.Vehicle).options(joinedload(models.Vehicle.owner), joinedload(
        models.Vehicle.license)).filter(models.Vehicle.id == vehicle_id, models.Vehicle.is_deleted == 0).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return v


@router.get("/by_plate/{plate}", response_model=schemas.VehicleOut)
def get_by_plate(plate: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    v = db.query(models.Vehicle).options(joinedload(models.Vehicle.owner), joinedload(
        models.Vehicle.license)).filter(models.Vehicle.plate_number == plate, models.Vehicle.is_deleted == 0).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return v


@router.get("/by_qr/{qr}", response_model=schemas.VehicleOut)
def get_by_qr(qr: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    v = db.query(models.Vehicle).options(joinedload(models.Vehicle.owner), joinedload(
        models.Vehicle.license)).filter(models.Vehicle.qr_value == qr, models.Vehicle.is_deleted == 0).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return v


@router.get("/by_side/{side}", response_model=schemas.VehicleOut)
def get_by_side(side: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    v = db.query(models.Vehicle).options(joinedload(models.Vehicle.owner), joinedload(
        models.Vehicle.license)).filter(models.Vehicle.side_number == side, models.Vehicle.is_deleted == 0).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return v


@router.post("/", response_model=schemas.VehicleOut)
def create_vehicle(payload: schemas.VehicleCreate, db: Session = Depends(get_db), user: models.User = Depends(require_role('admin'))):
    # owner
    owner_obj = None
    if payload.owner:
        owner_payload = payload.owner
        national_hash = None
        if getattr(owner_payload, 'national_id', None):
            national_hash = hashlib.sha256(
                owner_payload.national_id.encode()).hexdigest()
        owner_obj = models.Owner(full_name=owner_payload.full_name, phone=owner_payload.phone,
                                 address=owner_payload.address, national_id_hash=national_hash)
        db.add(owner_obj)
        db.flush()

    v = models.Vehicle(
        plate_number=payload.plate_number,
        qr_value=payload.qr_value,
        side_number=payload.side_number if getattr(
            payload, 'side_number', None) else None,
        status=payload.status or models.StatusEnum.active,
        owner_id=owner_obj.id if owner_obj else None
    )
    db.add(v)
    try:
        db.flush()
    except IntegrityError as e:
        db.rollback()
        # likely unique constraint on plate_number or other integrity issue
        raise HTTPException(
            status_code=400, detail="Vehicle with this plate number already exists")

    if payload.license:
        lic = models.License(vehicle_id=v.id, start_date=payload.license.start_date,
                             expiry_date=payload.license.expiry_date, renewal_status=payload.license.renewal_status)
        db.add(lic)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400, detail="Vehicle could not be created due to integrity constraints")
    db.refresh(v)
    return v


@router.put("/{vehicle_id}", response_model=schemas.VehicleOut)
def update_vehicle(vehicle_id: int, payload: schemas.VehicleUpdate, db: Session = Depends(get_db), user: models.User = Depends(require_role('admin'))):
    v = db.query(models.Vehicle).filter(models.Vehicle.id ==
                                        vehicle_id, models.Vehicle.is_deleted == 0).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    if payload.plate_number is not None:
        v.plate_number = payload.plate_number
    if payload.qr_value is not None:
        v.qr_value = payload.qr_value
    if getattr(payload, 'side_number', None) is not None:
        v.side_number = payload.side_number
    if payload.status is not None:
        try:
            v.status = models.StatusEnum(payload.status)
        except Exception:
            v.status = models.StatusEnum.active

    # owner handling: update existing or create new
    if payload.owner:
        if v.owner:
            v.owner.full_name = payload.owner.full_name
            v.owner.phone = payload.owner.phone
            v.owner.address = payload.owner.address
            if getattr(payload.owner, 'national_id', None):
                v.owner.national_id_hash = hashlib.sha256(
                    payload.owner.national_id.encode()).hexdigest()
        else:
            national_hash = None
            if getattr(payload.owner, 'national_id', None):
                national_hash = hashlib.sha256(
                    payload.owner.national_id.encode()).hexdigest()
            owner_obj = models.Owner(full_name=payload.owner.full_name, phone=payload.owner.phone,
                                     address=payload.owner.address, national_id_hash=national_hash)
            db.add(owner_obj)
            db.flush()
            v.owner_id = owner_obj.id

    # license handling
    if payload.license:
        if v.license:
            v.license.start_date = payload.license.start_date
            v.license.expiry_date = payload.license.expiry_date
            v.license.renewal_status = payload.license.renewal_status
        else:
            lic = models.License(vehicle_id=v.id, start_date=payload.license.start_date,
                                 expiry_date=payload.license.expiry_date, renewal_status=payload.license.renewal_status)
            db.add(lic)

    db.add(v)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400, detail="Update failed due to integrity constraints (possible duplicate plate)")
    db.refresh(v)
    return v


@router.delete("/{vehicle_id}")
def delete_vehicle(vehicle_id: int, db: Session = Depends(get_db), user: models.User = Depends(require_role('admin'))):
    v = db.query(models.Vehicle).filter(models.Vehicle.id ==
                                        vehicle_id, models.Vehicle.is_deleted == 0).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    # soft-delete: mark deleted and keep records for audit
    import datetime
    v.is_deleted = 1
    v.deleted_at = datetime.datetime.utcnow()
    db.add(v)
    db.commit()
    return {"ok": True}


@router.post("/{vehicle_id}/undelete", response_model=schemas.VehicleOut)
def undelete_vehicle(vehicle_id: int, db: Session = Depends(get_db), user: models.User = Depends(require_role('admin'))):
    v = db.query(models.Vehicle).options(joinedload(models.Vehicle.owner), joinedload(
        models.Vehicle.license)).filter(models.Vehicle.id == vehicle_id, models.Vehicle.is_deleted == 1).first()
    if not v:
        raise HTTPException(
            status_code=404, detail="Vehicle not found or not deleted")
    v.is_deleted = 0
    v.deleted_at = None
    db.add(v)
    db.commit()
    db.refresh(v)
    return v


@router.get("/deleted", response_model=list[schemas.VehicleOut])
def list_deleted(db: Session = Depends(get_db), user: models.User = Depends(require_role('admin'))):
    qs = db.query(models.Vehicle).options(joinedload(models.Vehicle.owner), joinedload(
        models.Vehicle.license)).filter(models.Vehicle.is_deleted == 1).all()
    return qs


@router.post("/{vehicle_id}/purge")
def purge_vehicle(vehicle_id: int, db: Session = Depends(get_db), user: models.User = Depends(require_role('admin'))):
    # permanently remove vehicle and associated license (owner left intact)
    v = db.query(models.Vehicle).options(joinedload(models.Vehicle.license)).filter(
        models.Vehicle.id == vehicle_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    if v.license:
        db.delete(v.license)
    db.delete(v)
    db.commit()
    return {"ok": True}


@router.get("/licenses/expiring", response_model=list[schemas.VehicleOut])
def licenses_expiring(days: int = 30, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Return vehicles whose license expiry_date is within the next `days` days (inclusive)."""
    today = date.today()
    cutoff = today + timedelta(days=days)
    qs = db.query(models.Vehicle).options(joinedload(models.Vehicle.owner), joinedload(models.Vehicle.license)).join(models.License).filter(
        models.Vehicle.is_deleted == 0,
        models.License.expiry_date >= today,
        models.License.expiry_date <= cutoff,
    ).all()
    return qs


@router.get("/licenses/expired", response_model=list[schemas.VehicleOut])
def licenses_expired(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Return vehicles whose license expiry_date is before today."""
    today = date.today()
    qs = db.query(models.Vehicle).options(joinedload(models.Vehicle.owner), joinedload(models.Vehicle.license)).join(models.License).filter(
        models.Vehicle.is_deleted == 0,
        models.License.expiry_date < today,
    ).all()
    return qs
