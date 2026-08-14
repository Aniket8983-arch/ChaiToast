"""pickups table — Collection stop events and scheduling records"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Float, DateTime, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..core.database import Base


class Pickup(Base):
    __tablename__ = "pickups"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    bin_id: Mapped[str | None] = mapped_column(String(20), ForeignKey("bins.id"), nullable=True, index=True)
    establishment: Mapped[str | None] = mapped_column(String(100), default="Commercial Premises")
    location: Mapped[str | None] = mapped_column(String(255), default="Zone A")
    waste_category: Mapped[str | None] = mapped_column(String(20), default="BIO")
    estimated_quantity: Mapped[float | None] = mapped_column(Float, default=50.0)      # Quantity in kg/litres
    scheduled_date: Mapped[str | None] = mapped_column(String(20))                       # YYYY-MM-DD
    scheduled_time: Mapped[str | None] = mapped_column(String(20))                       # HH:MM
    vehicle_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("vehicles.id"))
    driver_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("drivers.id"))
    assigned_vehicle: Mapped[str | None] = mapped_column(String(100))                    # Registration/Name
    assigned_driver: Mapped[str | None] = mapped_column(String(100))                     # Name
    job_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("collection_jobs.id"), index=True)
    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="SCHEDULED"
    )                                                                                    # SCHEDULED, ASSIGNED, IN_TRANSIT, ARRIVED, COLLECTED, COMPLETED, CANCELLED
    priority: Mapped[str] = mapped_column(
        String(20), default="MEDIUM"
    )                                                                                    # LOW, MEDIUM, HIGH, URGENT
    zone: Mapped[str | None] = mapped_column(String(50), index=True, default="Zone A")
    scheduled_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    arrived_at: Mapped[datetime | None] = mapped_column(DateTime)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime)
    waste_collected_liters: Mapped[float | None] = mapped_column(Float)
    waste_collected_kg: Mapped[float | None] = mapped_column(Float)
    fill_before_pct: Mapped[float | None] = mapped_column(Float, default=85.0)
    fill_after_pct: Mapped[float] = mapped_column(Float, default=5.0)
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    bin = relationship("Bin", back_populates="pickups")
    vehicle = relationship("Vehicle", back_populates="pickups")
    driver = relationship("Driver", back_populates="pickups")
    job = relationship("CollectionJob", back_populates="pickups")
    waste_records = relationship("WasteRecord", back_populates="pickup")
