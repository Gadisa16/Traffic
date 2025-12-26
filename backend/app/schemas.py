from datetime import date
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
    inspected_at: Optional[str]
    created_at: str

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


class VehicleOut(VehicleBase):
    id: int
    qr_value: Optional[str]
    status: Optional[str]
    owner: Optional[OwnerOut]
    license: Optional[LicenseOut] = None
    side_number: Optional[str]

    class Config:
        orm_mode = True


class Token(BaseModel):
    access_token: str
    token_type: str


class UserOut(BaseModel):
    id: int
    username: str
    role: str

    class Config:
        orm_mode = True
