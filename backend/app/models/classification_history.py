"""classification_history table — AI model inference log"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Float, Boolean, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..core.database import Base


class ClassificationHistory(Base):
    __tablename__ = "classification_history"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    bin_id: Mapped[str | None] = mapped_column(String(20), ForeignKey("bins.id"), index=True)
    device_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("device_status.id"))
    label: Mapped[str] = mapped_column(
        SAEnum("BIO", "NONBIO", name="classification_label"),
        nullable=False, index=True
    )
    confidence: Mapped[float] = mapped_column(Float, nullable=False)        # e.g. 0.9063
    raw_score: Mapped[float] = mapped_column(Float, nullable=False)         # Raw sigmoid value
    image_filename: Mapped[str | None] = mapped_column(String(255))
    image_hash: Mapped[str | None] = mapped_column(String(64))              # SHA-256
    hardware_command: Mapped[str | None] = mapped_column(String(5))         # 'B' or 'N'
    hardware_sent: Mapped[bool] = mapped_column(Boolean, default=False)
    hardware_mode: Mapped[str] = mapped_column(
        SAEnum("REAL", "SIMULATED", name="hw_mode_enum"),
        nullable=False, default="SIMULATED"
    )
    classified_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True
    )
    classified_by: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"))

    # Relationships
    bin = relationship("Bin", back_populates="classifications")
