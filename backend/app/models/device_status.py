"""device_status table — ESP32 device registry"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, DateTime, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..core.database import Base


class DeviceStatus(Base):
    __tablename__ = "device_status"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    device_label: Mapped[str] = mapped_column(String(50), nullable=False)   # e.g. "ESP32-001"
    device_type: Mapped[str] = mapped_column(String(50), default="ESP32_WROOM")
    firmware_version: Mapped[str] = mapped_column(String(20), default="1.0.0")
    serial_port: Mapped[str | None] = mapped_column(String(20))             # e.g. "COM4"
    baud_rate: Mapped[int] = mapped_column(Integer, default=115200)
    sensor_mode: Mapped[str] = mapped_column(
        SAEnum("SIMULATED", "REAL", name="sensor_mode"),
        nullable=False, default="SIMULATED"
    )
    status: Mapped[str] = mapped_column(
        SAEnum("ONLINE", "OFFLINE", "ERROR", name="device_status_enum"),
        default="OFFLINE"
    )
    last_seen: Mapped[datetime | None] = mapped_column(DateTime)
    last_command: Mapped[str | None] = mapped_column(String(10))
    uptime_seconds: Mapped[int] = mapped_column(Integer, default=0)
    total_commands: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    bin = relationship("Bin", back_populates="device", uselist=False)
    readings = relationship("SensorReading", back_populates="device")
