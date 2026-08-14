"""vehicles table — Waste collection fleet and simulated GPS movement"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Float, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..core.database import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    vehicle_id: Mapped[str | None] = mapped_column(String(36))                       # Alias ID e.g. TRK-101
    registration: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    registration_number: Mapped[str | None] = mapped_column(String(20))              # Alias for registration
    vehicle_type: Mapped[str] = mapped_column(
        String(20), nullable=False, default="MEDIUM"
    )                                                                                 # COMPACT, MEDIUM, LARGE
    capacity: Mapped[float] = mapped_column(Float, nullable=False, default=500.0)    # Capacity in liters/kg
    capacity_liters: Mapped[float] = mapped_column(Float, nullable=False, default=500.0)
    current_load: Mapped[float] = mapped_column(Float, default=0.0)                   # Current load
    current_load_liters: Mapped[float] = mapped_column(Float, default=0.0)
    driver_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("drivers.id"))
    driver_name: Mapped[str | None] = mapped_column(String(100), default="Rajesh Kumar")
    status: Mapped[str] = mapped_column(
        String(30), default="AVAILABLE"
    )                                                                                 # AVAILABLE, ASSIGNED, IN_TRANSIT, AT_PICKUP, RETURNING, MAINTENANCE, OFFLINE
    latitude: Mapped[float | None] = mapped_column(Float, default=18.5204)
    longitude: Mapped[float | None] = mapped_column(Float, default=73.8567)
    location_lat: Mapped[float | None] = mapped_column(Float, default=18.5204)
    location_lng: Mapped[float | None] = mapped_column(Float, default=73.8567)
    data_source: Mapped[str] = mapped_column(
        String(20), default="SIMULATED"
    )                                                                                 # SIMULATED or REAL
    location_source: Mapped[str] = mapped_column(
        String(20), default="SIMULATED"
    )
    location_updated_at: Mapped[datetime | None] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    odometer_km: Mapped[float] = mapped_column(Float, default=1240.0)
    fuel_percent: Mapped[float] = mapped_column(Float, default=88.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    driver = relationship("Driver", back_populates="vehicle", foreign_keys=[driver_id])
    jobs = relationship("CollectionJob", back_populates="vehicle")
    pickups = relationship("Pickup", back_populates="vehicle")
