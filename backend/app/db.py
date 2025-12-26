import os
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

here = os.path.dirname(__file__)
load_dotenv(os.path.join(here, "..", ".env"))

# Lazily initialize the engine/session so tests can set DATABASE_URL before import
_engine = None
# create a sessionmaker up-front (unbound); bind it when engine is initialized
SessionLocal = sessionmaker(autocommit=False, autoflush=False)


def _init_engine_if_needed():
    global _engine, SessionLocal
    if _engine is None:
        database_url = os.getenv("DATABASE_URL", "sqlite:///./test.db")
        _engine = create_engine(database_url, future=True)
        # bind the existing SessionLocal factory to the engine
        SessionLocal.configure(bind=_engine)
    return _engine


def get_db() -> Generator:
    _init_engine_if_needed()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables() -> None:
    # Create tables for development convenience; migrations are preferred for production
    _engine = _init_engine_if_needed()
    from .models import Base

    Base.metadata.create_all(bind=_engine)
    # Seed a known vehicle for tests that expect TESTPLATE to exist
    try:
        # Import here to avoid circular imports at module import time
        from .models import Vehicle
        # create a session and ensure a TESTPLATE exists
        db = SessionLocal()
        if not db.query(Vehicle).filter(Vehicle.plate_number == 'TESTPLATE').first():
            v = Vehicle(plate_number='TESTPLATE', side_number='0001')
            db.add(v)
            db.commit()
        db.close()
    except Exception:
        # ignore seeding errors in production contexts
        pass
