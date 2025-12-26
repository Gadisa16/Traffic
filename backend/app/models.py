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
    national_id_hash = Column(String, nullable=True)
    vehicles = relationship("Vehicle", back_populates="owner")


class Vehicle(Base):
    __tablename__ = "vehicles"
    id = Column(Integer, primary_key=True, index=True)
    plate_number = Column(String, unique=True, index=True, nullable=False)
    # Side Number: 4-digit operational ID painted on the vehicle (allow leading zeros)
    side_number = Column(String, unique=True, index=True, nullable=True)
    qr_value = Column(String, unique=True, index=True, nullable=True)
    status = Column(Enum(StatusEnum), default=StatusEnum.active)
    # Soft-delete support
    is_deleted = Column(Integer, default=0, nullable=False)
    deleted_at = Column(DateTime, nullable=True)
    owner_id = Column(Integer, ForeignKey("owners.id"))
    owner = relationship("Owner", back_populates="vehicles")
    # license relationship
    license = relationship("License", uselist=False, back_populates="vehicle")
    inspections = relationship("Inspection", back_populates="vehicle")


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
    role = Column(String, nullable=False)  # 'admin' or 'inspector'


class Inspection(Base):
    __tablename__ = "inspections"
    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), index=True, nullable=False)
    code = Column(String, nullable=False)
    inspector_username = Column(String, nullable=False)
    action = Column(String, nullable=True)
    note = Column(String, nullable=True)
    payload_json = Column(String, nullable=True)
    photo_url = Column(String, nullable=True)
    inspected_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False)
    vehicle = relationship("Vehicle", back_populates="inspections")
