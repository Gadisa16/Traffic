import os
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from urllib.parse import urlparse, urlunparse, parse_qsl, urlencode

here = os.path.dirname(__file__)
load_dotenv(os.path.join(here, "..", ".env"))

# Lazily initialize the engine/session so tests can set DATABASE_URL before import
_engine = None
# create a sessionmaker up-front (unbound); bind it when engine is initialized
SessionLocal = sessionmaker(autocommit=False, autoflush=False)


def _normalize_database_url(database_url: str) -> str:
    if not database_url:
        return database_url

    # SQLAlchemy needs an explicit driver for psycopg3.
    if database_url.startswith('postgresql://'):
        database_url = database_url.replace('postgresql://', 'postgresql+psycopg://', 1)
    elif database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql+psycopg://', 1)

    # Supabase requires SSL. If user forgets sslmode=require, add it.
    if database_url.startswith('postgresql+psycopg://'):
        u = urlparse(database_url)
        # Provide a clearer error if the URL is malformed (common when the '@' is missing).
        # psycopg can otherwise raise a confusing ipaddress.ValueError.
        if not u.hostname:
            raise ValueError(
                "Malformed DATABASE_URL: missing hostname. Expected format like "
                "postgresql://USER:PASSWORD@HOST:5432/DBNAME?sslmode=require"
            )
        q = dict(parse_qsl(u.query, keep_blank_values=True))
        if 'sslmode' not in q:
            q['sslmode'] = 'require'
        database_url = urlunparse(u._replace(query=urlencode(q)))

    return database_url


def _init_engine_if_needed():
    global _engine, SessionLocal
    if _engine is None:
        database_url = os.getenv("DATABASE_URL", "sqlite:///./test.db")
        try:
            database_url = _normalize_database_url(database_url)
            _engine = create_engine(database_url, future=True)
        except ValueError as e:
            # Avoid leaking passwords; show a sanitized hint.
            try:
                u = urlparse(database_url)
                safe = f"{u.scheme}://{u.username or ''}:***@{u.hostname or ''}{(':' + str(u.port)) if u.port else ''}{u.path or ''}"
            except Exception:
                safe = "<unparseable>"
            raise RuntimeError(
                f"Invalid DATABASE_URL. Parsed as: {safe}. "
                "Fix backend/.env DATABASE_URL. Example: "
                "postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres?sslmode=require"
            ) from e
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
