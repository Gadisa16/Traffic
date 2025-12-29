from sqlalchemy import Column, Integer, String, Date, ForeignKey, Enum, DateTime
from sqlalchemy.orm import declarative_base, relationship
import enum

Base = declarative_base()


class StatusEnum(str, enum.Enum):
    active = "active"
    expired = "expired"
    suspended = "suspended"


class Owner(Base):
    __tablename__ = "owners"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    tin_number = Column(String, nullable=True)
    fan_number = Column(String, nullable=True)
    national_id_hash = Column(String, nullable=True)
    vehicles = relationship("Vehicle", back_populates="owner")
    documents = relationship("OwnerDocument", back_populates="owner")


class Vehicle(Base):
    __tablename__ = "vehicles"
    id = Column(Integer, primary_key=True, index=True)
    plate_number = Column(String, unique=True, index=True, nullable=False)
    # Side Number: 4-digit operational ID painted on the vehicle (allow leading zeros)
    side_number = Column(String, unique=True, index=True, nullable=True)
    qr_value = Column(String, unique=True, index=True, nullable=True)
    vehicle_type = Column(String, nullable=True)
    make = Column(String, nullable=True)
    model = Column(String, nullable=True)
    color = Column(String, nullable=True)
    year = Column(Integer, nullable=True)
    status = Column(Enum(StatusEnum), default=StatusEnum.active)
    # Soft-delete support
    is_deleted = Column(Integer, default=0, nullable=False)
    deleted_at = Column(DateTime, nullable=True)
    owner_id = Column(Integer, ForeignKey("owners.id"))
    owner = relationship("Owner", back_populates="vehicles")
    # license relationship
    license = relationship("License", uselist=False, back_populates="vehicle")
    inspections = relationship("Inspection", back_populates="vehicle")
    photos = relationship("VehiclePhoto", back_populates="vehicle")


class License(Base):
    __tablename__ = "licenses"
    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), unique=True)
    start_date = Column(Date, nullable=False)
    expiry_date = Column(Date, nullable=False)
    renewal_status = Column(String, nullable=True)
    vehicle = relationship("Vehicle", back_populates="license")


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    # Role: 'public', 'inspector', 'admin', 'super_admin'
    role = Column(String, nullable=False)
    # Status: 'pending', 'pending_verification', 'active', 'rejected', 'disabled'
    status = Column(String, nullable=False, default='active')
    email = Column(String, unique=True, index=True, nullable=True)
    phone = Column(String, unique=True, index=True, nullable=True)
    email_verified = Column(Integer, default=0, nullable=False)
    phone_verified = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, nullable=True)

    documents = relationship("UserDocument", back_populates="user")


class Inspection(Base):
    __tablename__ = "inspections"
    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey(
        "vehicles.id"), index=True, nullable=False)
    code = Column(String, nullable=False)
    inspector_username = Column(String, nullable=False)
    action = Column(String, nullable=True)
    note = Column(String, nullable=True)
    payload_json = Column(String, nullable=True)
    photo_url = Column(String, nullable=True)
    inspected_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False)
    vehicle = relationship("Vehicle", back_populates="inspections")


class UserDocument(Base):
    __tablename__ = "user_documents"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"),
                     index=True, nullable=False)
    doc_type = Column(String, nullable=False)
    file_bucket = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_url = Column(String, nullable=False)
    # pending/approved/rejected
    status = Column(String, nullable=False, default='pending')
    rejection_reason = Column(String, nullable=True)
    uploaded_at = Column(DateTime, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    reviewed_by_user_id = Column(Integer, nullable=True)

    user = relationship("User", back_populates="documents")


class OwnerDocument(Base):
    __tablename__ = "owner_documents"
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("owners.id"),
                      index=True, nullable=False)
    doc_type = Column(String, nullable=False)
    file_bucket = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_url = Column(String, nullable=False)
    status = Column(String, nullable=False, default='pending')
    rejection_reason = Column(String, nullable=True)
    uploaded_at = Column(DateTime, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    reviewed_by_user_id = Column(Integer, nullable=True)

    owner = relationship("Owner", back_populates="documents")


class VehiclePhoto(Base):
    __tablename__ = "vehicle_photos"
    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey(
        "vehicles.id"), index=True, nullable=False)
    file_bucket = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_url = Column(String, nullable=False)
    kind = Column(String, nullable=True)
    created_at = Column(DateTime, nullable=True)

    vehicle = relationship("Vehicle", back_populates="photos")
