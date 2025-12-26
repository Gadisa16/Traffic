from datetime import date, datetime
from pydantic import BaseModel, constr
from typing import Optional, Any, Dict

# Side number: exactly 4 digits, allow leading zeros
SideNumber = constr(regex=r"^\d{4}$")


class OwnerBase(BaseModel):
    full_name: str
    phone: Optional[str]
    address: Optional[str]


class OwnerCreate(OwnerBase):
    national_id: Optional[str]


class OwnerOut(OwnerBase):
    id: int

    class Config:
        orm_mode = True


class OwnerInspectorOut(BaseModel):
    name: str
    mask_phone: Optional[str] = None


class VehicleVerifyOut(BaseModel):
    plate_number: str
    side_number: Optional[str] = None
    status: str
    license_expiry: Optional[str] = None
    owner: Optional[OwnerInspectorOut] = None
    qr_value: Optional[str] = None


class VehicleQrOut(BaseModel):
    vehicle_id: int
    qr_value: str
    qr_png_url: str


class VehiclePhotoOut(BaseModel):
    id: int
    file_url: str
    kind: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        orm_mode = True


class InspectionCreate(BaseModel):
    code: str
    when: Optional[str] = None
    action: Optional[str] = None
    note: Optional[str] = None
    payload: Optional[Dict[str, Any]] = None


class InspectionOut(BaseModel):
    id: int
    vehicle_id: int
    code: str
    inspector_username: str
    action: Optional[str]
    note: Optional[str]
    payload_json: Optional[str]
    photo_url: Optional[str]
    inspected_at: Optional[datetime]
    created_at: datetime

    class Config:
        orm_mode = True


class LicenseBase(BaseModel):
    start_date: date
    expiry_date: date
    renewal_status: Optional[str]


class LicenseOut(LicenseBase):
    class Config:
        orm_mode = True


class VehicleBase(BaseModel):
    plate_number: str
    side_number: Optional[SideNumber]
    vehicle_type: Optional[str] = None
    make: Optional[str] = None
    model: Optional[str] = None
    color: Optional[str] = None
    year: Optional[int] = None


class LicenseCreate(LicenseBase):
    pass


class VehicleCreate(VehicleBase):
    qr_value: Optional[str]
    status: Optional[str]
    owner: Optional[OwnerCreate]
    license: Optional[LicenseCreate]


class VehicleUpdate(BaseModel):
    plate_number: Optional[str]
    qr_value: Optional[str]
    status: Optional[str]
    owner: Optional[OwnerCreate]
    license: Optional[LicenseCreate]
    side_number: Optional[SideNumber]
    vehicle_type: Optional[str] = None
    make: Optional[str] = None
    model: Optional[str] = None
    color: Optional[str] = None
    year: Optional[int] = None


class VehicleOut(VehicleBase):
    id: int
    qr_value: Optional[str]
    status: Optional[str]
    owner: Optional[OwnerOut]
    license: Optional[LicenseOut] = None
    side_number: Optional[str]
    photos: Optional[list[VehiclePhotoOut]] = None

    class Config:
        orm_mode = True


class Token(BaseModel):
    access_token: str
    token_type: str


class UserOut(BaseModel):
    id: int
    username: str
    role: str
    status: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    email_verified: Optional[int] = None
    phone_verified: Optional[int] = None

    class Config:
        orm_mode = True


class RegisterBody(BaseModel):
    username: str
    password: str
    role: str = "public"  # public/inspector/admin
    email: Optional[str] = None
    phone: Optional[str] = None


class VerifyOtpBody(BaseModel):
    otp: str
    method: str  # email or phone


class UserDocumentOut(BaseModel):
    id: int
    user_id: int
    doc_type: str
    file_url: str
    status: str
    rejection_reason: Optional[str] = None
    uploaded_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    reviewed_by_user_id: Optional[int] = None

    class Config:
        orm_mode = True
