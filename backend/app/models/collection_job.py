"""collection_jobs table — Waste collection job scheduling"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Float, Integer, DateTime, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..core.database import Base


class CollectionJob(Base):
    __tablename__ = "collection_jobs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    vehicle_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("vehicles.id"))
    driver_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("drivers.id"))
    zone: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    status: Mapped[str] = mapped_column(
        SAEnum("SCHEDULED", "IN_PROGRESS", "COMPLETED", "MISSED", "CANCELLED", "DELAYED",
               name="job_status"),
        default="SCHEDULED"
    )
    priority: Mapped[str] = mapped_column(
        SAEnum("LOW", "MEDIUM", "HIGH", "URGENT", name="priority_enum"),
        default="MEDIUM"
    )
    scheduled_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    started_at: Mapped[datetime | None] = mapped_column(DateTime)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime)
    estimated_duration_min: Mapped[int | None] = mapped_column(Integer)
    total_collected_liters: Mapped[float | None] = mapped_column(Float)
    notes: Mapped[str | None] = mapped_column(Text)
    created_by: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    vehicle = relationship("Vehicle", back_populates="jobs")
    driver = relationship("Driver", back_populates="jobs")
    pickups = relationship("Pickup", back_populates="job",
                           order_by="Pickup.scheduled_at")
