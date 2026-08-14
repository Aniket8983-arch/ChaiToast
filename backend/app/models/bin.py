"""bins table — Waste bin registry"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Float, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..core.database import Base


class Bin(Base):
    __tablename__ = "bins"

    id: Mapped[str] = mapped_column(String(20), primary_key=True)          # e.g. "BIN-001"
    label: Mapped[str] = mapped_column(String(100), nullable=False)
    location_address: Mapped[str | None] = mapped_column(String(255))
    location_lat: Mapped[float] = mapped_column(Float, nullable=False, default=18.5204)
    location_lng: Mapped[float] = mapped_column(Float, nullable=False, default=73.8567)
    zone: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    category: Mapped[str] = mapped_column(
        SAEnum("BIO", "NONBIO", "MIXED", name="bin_category"),
        nullable=False
    )
    capacity_liters: Mapped[float] = mapped_column(Float, nullable=False, default=60.0)
    current_fill_pct: Mapped[float] = mapped_column(Float, default=0.0)    # 0.0 – 100.0
    status: Mapped[str] = mapped_column(
        SAEnum("ONLINE", "OFFLINE", "FULL", "MAINTENANCE", name="bin_status"),
        default="ONLINE"
    )
    data_source: Mapped[str] = mapped_column(
        String(20), default="SIMULATED", nullable=False                     # "SIMULATED" or "REAL"
    )
    device_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("device_status.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    # Helper alias properties matching user prompt field names
    @property
    def bin_id(self) -> str:
        return self.id

    @property
    def bin_name(self) -> str:
        return self.label

    @property
    def location(self) -> str:
        return self.location_address or f"{self.zone} ({self.location_lat}, {self.location_lng})"

    @property
    def capacity_litres(self) -> float:
        return self.capacity_liters

    @property
    def current_fill_percentage(self) -> float:
        return self.current_fill_pct

    @property
    def waste_category(self) -> str:
        return self.category

    @property
    def device_status(self) -> str:
        return self.status

    @property
    def last_updated(self) -> str:
        return self.updated_at.isoformat() if self.updated_at else datetime.now(timezone.utc).isoformat()

    # Relationships
    device = relationship("DeviceStatus", back_populates="bin")
    sensor_readings = relationship("SensorReading", back_populates="bin",
                                   order_by="SensorReading.recorded_at.desc()")
    waste_records = relationship("WasteRecord", back_populates="bin")
    alerts = relationship("Alert", back_populates="bin")
    pickups = relationship("Pickup", back_populates="bin")
    classifications = relationship("ClassificationHistory", back_populates="bin")
