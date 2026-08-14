"""drivers table — Waste collection personnel"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Float, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..core.database import Base


class Driver(Base):
    __tablename__ = "drivers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20))
    license_number: Mapped[str | None] = mapped_column(String(30), unique=True)
    status: Mapped[str] = mapped_column(
        SAEnum("ON_DUTY", "OFF_DUTY", "ON_LEAVE", name="driver_status"),
        default="OFF_DUTY"
    )
    assigned_vehicle_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("vehicles.id"))
    compliance_score: Mapped[float] = mapped_column(Float, default=100.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    vehicle = relationship("Vehicle", foreign_keys=[assigned_vehicle_id])
    jobs = relationship("CollectionJob", back_populates="driver")
    pickups = relationship("Pickup", back_populates="driver")
