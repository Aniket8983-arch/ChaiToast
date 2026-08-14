"""
SmartWaste 360 — Database Configuration
SQLAlchemy engine, session factory, and Base declarative.
"""
from pathlib import Path
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, DeclarativeBase, Session
from typing import Generator

from .config import settings


# Ensure data directory exists before creating the DB file
data_dir = Path(__file__).parents[3] / "data"
data_dir.mkdir(parents=True, exist_ok=True)

# Build absolute path for SQLite so it's stable regardless of working directory
if settings.DATABASE_URL.startswith("sqlite"):
    db_path = data_dir / "smartwaste.db"
    DATABASE_URL = f"sqlite:///{db_path}"
else:
    DATABASE_URL = settings.DATABASE_URL

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # Required for SQLite with FastAPI
    echo=settings.DEBUG,                        # Log SQL in debug mode
)

# Enable WAL mode for better SQLite concurrent read performance
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_conn, connection_record):
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""
    pass


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency — yields a database session and closes it after use."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_all_tables() -> None:
    """Create all tables defined in ORM models. Called on app startup."""
    # Import all models here to register them with Base before create_all()
    from ..models import (  # noqa: F401
        user, device_status, bin, sensor_reading,
        vehicle, driver, collection_job, pickup,
        waste_record, classification_history, alert,
    )
    Base.metadata.create_all(bind=engine)
