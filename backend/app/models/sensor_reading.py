"""sensor_readings table — Time-series fill-level data from real or simulated sensors"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Float, DateTime, ForeignKey, Enum as SAEnum, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..core.database import Base


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    bin_id: Mapped[str] = mapped_column(String(20), ForeignKey("bins.id"), nullable=False, index=True)
    device_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("device_status.id"))
    fill_percent: Mapped[float] = mapped_column(Float, nullable=False)      # 0.0 – 100.0
    fill_liters: Mapped[float | None] = mapped_column(Float)                # derived from capacity
    raw_distance_cm: Mapped[float | None] = mapped_column(Float)            # null for simulated
    # ── CORE CONTRACT: data_source is NEVER NULL ──────────────────────────
    data_source: Mapped[str] = mapped_column(
        SAEnum("SIMULATED", "REAL", name="data_source_enum"),
        nullable=False                                                       # No default — must be explicit
    )
    recorded_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    bin = relationship("Bin", back_populates="sensor_readings")
    device = relationship("DeviceStatus", back_populates="readings")

    # Composite index for efficient time-series queries per bin
    __table_args__ = (
        Index("ix_sensor_bin_time", "bin_id", "recorded_at"),
    )
