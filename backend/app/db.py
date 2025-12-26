import os
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

here = os.path.dirname(__file__)
load_dotenv(os.path.join(here, "..", ".env"))

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./test.db")

# Use future=True for SQLAlchemy 2.0 style
engine = create_engine(DATABASE_URL, future=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables() -> None:
    # Create tables for development convenience; migrations are preferred for production
    from .models import Base

    Base.metadata.create_all(bind=engine)
