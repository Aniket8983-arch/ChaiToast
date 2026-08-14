"""waste_records table — Waste collection audit log"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Float, DateTime, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..core.database import Base


class WasteRecord(Base):
    __tablename__ = "waste_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    bin_id: Mapped[str] = mapped_column(String(20), ForeignKey("bins.id"), nullable=False, index=True)
    pickup_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("pickups.id"))
    waste_type: Mapped[str] = mapped_column(
        SAEnum("BIO", "NONBIO", "MIXED", name="waste_type_enum"),
        nullable=False
    )
    weight_kg: Mapped[float | None] = mapped_column(Float)
    volume_liters: Mapped[float] = mapped_column(Float, nullable=False)
    recorded_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    recorded_by: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"))
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    bin = relationship("Bin", back_populates="waste_records")
    pickup = relationship("Pickup", back_populates="waste_records")
