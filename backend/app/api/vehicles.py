from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi import UploadFile, File, Form
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from .. import models, schemas
from ..db import get_db
import hashlib
from .deps import get_current_user, require_role, require_any_role, get_current_user_optional
from datetime import date, timedelta
import os
import uuid
import io
import datetime

import qrcode

from ..storage import upload_bytes, create_signed_url

router = APIRouter(prefix="/vehicles", tags=["vehicles"])


def require_admin(user: models.User = Depends(require_any_role('admin', 'super_admin'))):
    return user


def _mask_phone(phone: Optional[str]) -> Optional[str]:
    if not phone:
        return None
    p = str(phone)
    if len(p) <= 3:
        return "***"
    return f"***{p[-3:]}"


def _refresh_photo_urls(vehicle: models.Vehicle) -> None:
    """Refresh URLs for vehicle photos in-place."""
    if not vehicle.photos:
        return

    from ..storage import create_public_url

    for photo in vehicle.photos:
        try:
            # Treat public buckets (vehicle-photos and qr-codes) the same and
            # return the public URL. Other buckets remain signed.
            if photo.file_bucket in ('vehicle-photos', 'qr-codes'):
                fresh_url = create_public_url(
                    bucket=photo.file_bucket,
                    path=photo.file_path
                )
            else:
                # Use signed URL for private buckets
                fresh_url = create_signed_url(
                    bucket=photo.file_bucket,
                    path=photo.file_path,
                    expires_in=int(
                        os.getenv('SUPABASE_SIGNED_URL_TTL_SECONDS', '3600'))
                )
            photo.file_url = fresh_url
        except Exception as e:
            # If refresh fails, keep the old URL
            print(
                f"Warning: Failed to refresh photo URL for photo {photo.id}: {e}")


def _normalize_vehicle(v: models.Vehicle) -> None:
    """Attach compatibility attributes expected by frontend code.

    - `owners`: alias to `owner` (some clients use plural)
    - `license_start_date` / `license_expiry_date`: ISO strings extracted from v.license
    """
    try:
        # alias owner -> owners for older frontend expectations
        setattr(v, 'owners', getattr(v, 'owner', None))
    except Exception:
        pass

    try:
        if getattr(v, 'license', None):
            if getattr(v.license, 'start_date', None):
                setattr(v, 'license_start_date',
                        v.license.start_date.isoformat())
            if getattr(v.license, 'expiry_date', None):
                setattr(v, 'license_expiry_date',
                        v.license.expiry_date.isoformat())
    except Exception:
        pass


def _license_expiry_str(v: models.Vehicle) -> Optional[str]:
    try:
        if v.license and v.license.expiry_date:
            return v.license.expiry_date.isoformat()
    except Exception:
        return None
    return None


@router.get("/verify", response_model=schemas.VehicleVerifyOut)
def verify_vehicle(
    code: str = Query(...,
                      description="QR value, plate number, or side number"),
    db: Session = Depends(get_db),
    user: Optional[models.User] = Depends(get_current_user_optional),
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

    effective_role = 'public'
    if user is not None and getattr(user, 'status', 'active') == 'active':
        effective_role = user.role

    owner = None
    if v.owner and effective_role != 'public':
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


@router.get('/stats/summary')
def stats_summary(db: Session = Depends(get_db)):
    today = date.today()
    soon = today + timedelta(days=30)

    vehicles = db.query(models.Vehicle).options(joinedload(
        models.Vehicle.license)).filter(models.Vehicle.is_deleted == 0).all()

    total = 0
    valid = 0
    expired = 0
    expiring = 0
    unknown = 0

    for v in vehicles:
        total += 1
        if not v.license or not v.license.expiry_date:
            unknown += 1
            continue
        exp = v.license.expiry_date
        if exp < today:
            expired += 1
        elif exp <= soon:
            expiring += 1
        else:
            valid += 1

    return {
        'total_vehicles': total,
        'valid_license': valid,
        'expired_license': expired,
        'expiring_soon_license': expiring,
        'unknown_license': unknown,
    }


@router.get("/qr/{qr_value}.png")
def get_qr_png(qr_value: str):
    # Legacy endpoint: QR images are now stored in external storage.
    # Return 404 so clients use the URL returned by POST /vehicles/{id}/qr.
    raise HTTPException(
        status_code=404, detail="QR image not served here; use qr_png_url from /vehicles/{id}/qr")


@router.post("/{vehicle_id}/qr", response_model=schemas.VehicleQrOut)
def generate_vehicle_qr(
    vehicle_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_admin),
):
    v = db.query(models.Vehicle).filter(models.Vehicle.id ==
                                        vehicle_id, models.Vehicle.is_deleted == 0).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    if not v.qr_value:
        v.qr_value = uuid.uuid4().hex
        db.add(v)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=400, detail="Failed to generate QR value")
        db.refresh(v)

    img = qrcode.make(v.qr_value)
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    _, signed_url = upload_bytes(
        bucket='qr-codes',
        folder='',
        filename=f"vehicle-{v.id}.png",
        content=buf.getvalue(),
        content_type='image/png',
    )

    # include generated timestamp so clients can display when the QR was created
    generated_at = datetime.datetime.utcnow().isoformat()

    return {
        "vehicle_id": v.id,
        "qr_value": v.qr_value,
        "qr_png_url": signed_url,
        "qr_generated_at": generated_at,
    }


@router.post("/{vehicle_id}/photos", response_model=list[schemas.VehiclePhotoOut])
def upload_vehicle_photos(
    vehicle_id: int,
    files: list[UploadFile] = File(...),
    kind: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    user: models.User = Depends(require_admin),
):
    v = db.query(models.Vehicle).filter(models.Vehicle.id ==
                                        vehicle_id, models.Vehicle.is_deleted == 0).first()
    if not v:
        raise HTTPException(status_code=404, detail='Vehicle not found')

    out: list[models.VehiclePhoto] = []
    for f in files:
        content = f.file.read()
        content_type = f.content_type or 'application/octet-stream'
        filename = f.filename or f"{uuid.uuid4().hex}"
        path, url = upload_bytes(
            bucket='vehicle-photos',
            folder=f"vehicle-{vehicle_id}",
            filename=filename,
            content=content,
            content_type=content_type,
        )
        photo = models.VehiclePhoto(
            vehicle_id=vehicle_id,
            file_bucket='vehicle-photos',
            file_path=path,
            file_url=url,
            kind=kind,
            created_at=datetime.datetime.utcnow(),
        )
        db.add(photo)
        out.append(photo)

    db.commit()
    for p in out:
        db.refresh(p)
    return out


@router.get("/", response_model=list[schemas.VehicleOut])
def list_vehicles(
    plate: Optional[str] = Query(
        None, description="Filter by plate (substring, case-insensitive)"),
    side: Optional[str] = Query(
        None, description="Filter by exact side number"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin),
):
    """List vehicles. Optional query params:
    - `plate`: substring match (case-insensitive)
    - `side`: exact 4-digit side number
    """
    qs = db.query(models.Vehicle).options(
        joinedload(models.Vehicle.owner),
        joinedload(models.Vehicle.license),
        joinedload(models.Vehicle.photos),
    ).filter(models.Vehicle.is_deleted == 0)
    if plate:
        # case-insensitive substring match
        try:
            qs = qs.filter(models.Vehicle.plate_number.ilike(f"%{plate}%"))
        except Exception:
            qs = qs.filter(models.Vehicle.plate_number.contains(plate))
    if side:
        qs = qs.filter(models.Vehicle.side_number == side)
    res = qs.all()
    for v in res:
        _refresh_photo_urls(v)
        _normalize_vehicle(v)
    return res


@router.get("/{vehicle_id}", response_model=schemas.VehicleOut)
def get_vehicle(vehicle_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(require_admin)):
    v = db.query(models.Vehicle).options(
        joinedload(models.Vehicle.owner),
        joinedload(models.Vehicle.license),
        joinedload(models.Vehicle.photos),
    ).filter(models.Vehicle.id == vehicle_id, models.Vehicle.is_deleted == 0).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    _refresh_photo_urls(v)
    _normalize_vehicle(v)
    return v


@router.get("/by_plate/{plate}", response_model=schemas.VehicleOut)
def get_by_plate(plate: str, db: Session = Depends(get_db), current_user: models.User = Depends(require_admin)):
    v = db.query(models.Vehicle).options(
        joinedload(models.Vehicle.owner),
        joinedload(models.Vehicle.license),
        joinedload(models.Vehicle.photos),
    ).filter(models.Vehicle.plate_number == plate, models.Vehicle.is_deleted == 0).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    _refresh_photo_urls(v)
    _normalize_vehicle(v)
    return v


@router.get("/by_qr/{qr}", response_model=schemas.VehicleOut)
def get_by_qr(qr: str, db: Session = Depends(get_db), current_user: models.User = Depends(require_admin)):
    v = db.query(models.Vehicle).options(
        joinedload(models.Vehicle.owner),
        joinedload(models.Vehicle.license),
        joinedload(models.Vehicle.photos),
    ).filter(models.Vehicle.qr_value == qr, models.Vehicle.is_deleted == 0).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    _normalize_vehicle(v)
    return v


@router.get("/by_side/{side}", response_model=schemas.VehicleOut)
def get_by_side(side: str, db: Session = Depends(get_db), current_user: models.User = Depends(require_admin)):
    v = db.query(models.Vehicle).options(
        joinedload(models.Vehicle.owner),
        joinedload(models.Vehicle.license),
        joinedload(models.Vehicle.photos),
    ).filter(models.Vehicle.side_number == side, models.Vehicle.is_deleted == 0).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    _normalize_vehicle(v)
    return v


@router.post("/", response_model=schemas.VehicleOut)
def create_vehicle(payload: schemas.VehicleCreate, db: Session = Depends(get_db), user: models.User = Depends(require_admin)):
    # owner: allow linking an existing owner via owner_id or creating a new owner via owner
    owner_obj = None
    if getattr(payload, 'owner_id', None) is not None:
        owner_id = payload.owner_id
    else:
        owner_id = None

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
        vehicle_type=getattr(payload, 'vehicle_type', None),
        make=getattr(payload, 'make', None),
        model=getattr(payload, 'model', None),
        color=getattr(payload, 'color', None),
        year=getattr(payload, 'year', None),
        status=payload.status or models.StatusEnum.active,
        owner_id=owner_obj.id if owner_obj else (
            owner_id if owner_id is not None else None)
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
    _normalize_vehicle(v)
    return v


@router.put("/{vehicle_id}", response_model=schemas.VehicleOut)
def update_vehicle(vehicle_id: int, payload: schemas.VehicleUpdate, db: Session = Depends(get_db), user: models.User = Depends(require_admin)):
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

    if getattr(payload, 'vehicle_type', None) is not None:
        v.vehicle_type = payload.vehicle_type
    if getattr(payload, 'make', None) is not None:
        v.make = payload.make
    if getattr(payload, 'model', None) is not None:
        v.model = payload.model
    if getattr(payload, 'color', None) is not None:
        v.color = payload.color
    if getattr(payload, 'year', None) is not None:
        v.year = payload.year

    # owner handling: update existing or create new
    # owner handling: support linking an existing owner by id, updating existing owner, or creating a new owner
    if getattr(payload, 'owner_id', None) is not None:
        # assign existing owner by id
        v.owner_id = payload.owner_id
    elif payload.owner:
        # payload.owner is an OwnerCreate -> either update current owner or create a new one
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
    _normalize_vehicle(v)
    return v


@router.delete("/{vehicle_id}/photos/{photo_id}")
def delete_vehicle_photo(
    vehicle_id: int,
    photo_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_admin)
):
    photo = db.query(models.VehiclePhoto).filter(
        models.VehiclePhoto.id == photo_id,
        models.VehiclePhoto.vehicle_id == vehicle_id
    ).first()
    if not photo:
        raise HTTPException(status_code=404, detail='Photo not found')

    db.delete(photo)
    db.commit()
    return {'message': 'Photo deleted successfully'}


@router.delete("/{vehicle_id}")
def delete_vehicle(vehicle_id: int, db: Session = Depends(get_db), user: models.User = Depends(require_admin)):
    v = db.query(models.Vehicle).filter(models.Vehicle.id ==
                                        vehicle_id, models.Vehicle.is_deleted == 0).first()
    if not v:
        raise HTTPException(status_code=404, detail='Vehicle not found')
    v.is_deleted = 1
    v.deleted_at = datetime.datetime.utcnow()
    db.commit()
    return {'message': 'Vehicle soft-deleted'}


@router.post("/{vehicle_id}/undelete", response_model=schemas.VehicleOut)
def undelete_vehicle(vehicle_id: int, db: Session = Depends(get_db), user: models.User = Depends(require_admin)):
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
    _normalize_vehicle(v)
    return v


@router.get("/deleted", response_model=list[schemas.VehicleOut])
def list_deleted(db: Session = Depends(get_db), user: models.User = Depends(require_admin)):
    qs = db.query(models.Vehicle).options(joinedload(models.Vehicle.owner), joinedload(
        models.Vehicle.license)).filter(models.Vehicle.is_deleted == 1).all()
    for v in qs:
        _normalize_vehicle(v)
    return qs


@router.post("/{vehicle_id}/purge")
def purge_vehicle(vehicle_id: int, db: Session = Depends(get_db), user: models.User = Depends(require_admin)):
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
