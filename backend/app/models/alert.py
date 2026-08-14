"""alerts table — Centralized alert management and duplicate prevention engine"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..core.database import Base


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    alert_id: Mapped[str | None] = mapped_column(String(36))                       # Alias field
    alert_type: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True
    )                                                                              # BIN_ALMOST_FULL, BIN_CRITICAL, MISSED_PICKUP, DELAYED_PICKUP, VEHICLE_UNAVAILABLE, DEVICE_OFFLINE, SYSTEM_ERROR
    severity: Mapped[str] = mapped_column(
        String(20), nullable=False, default="INFO"
    )                                                                              # INFO, WARNING, CRITICAL
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    entity_type: Mapped[str | None] = mapped_column(String(30))                     # BIN, PICKUP, VEHICLE, DEVICE, SYSTEM
    related_entity: Mapped[str | None] = mapped_column(String(30))                  # Alias for entity_type
    related_entity_id: Mapped[str | None] = mapped_column(String(50))              # ID of bin, pickup, vehicle, device
    bin_id: Mapped[str | None] = mapped_column(String(20), ForeignKey("bins.id"))
    vehicle_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("vehicles.id"))
    device_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("device_status.id"))
    job_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("collection_jobs.id"))
    status: Mapped[str] = mapped_column(
        String(20), default="ACTIVE", index=True
    )                                                                              # ACTIVE, RESOLVED, ACKNOWLEDGED
    acknowledged: Mapped[bool] = mapped_column(Boolean, default=False)
    acknowledged_by: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"))
    acknowledged_at: Mapped[datetime | None] = mapped_column(DateTime)
    resolved: Mapped[bool] = mapped_column(Boolean, default=False)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), index=True
    )

    # Relationships
    bin = relationship("Bin", back_populates="alerts")
    vehicle = relationship("Vehicle")
    device = relationship("DeviceStatus")
