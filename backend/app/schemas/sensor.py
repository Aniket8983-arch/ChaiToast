"""Sensor reading Pydantic schemas — shared contract for real and simulated data"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal
from datetime import datetime, timezone
from enum import Enum


class DataSource(str, Enum):
    SIMULATED = "SIMULATED"
    REAL = "REAL"


class SensorReadingCreate(BaseModel):
    """
    SHARED CONTRACT: Used by both the simulation service and real ESP32 hardware.
    data_source is required with no default — must be explicitly 'SIMULATED' or 'REAL'.
    """
    bin_id: str
    device_id: Optional[str] = None
    fill_percent: float = Field(ge=0.0, le=100.0)
    fill_liters: Optional[float] = None
    raw_distance_cm: Optional[float] = None    # None for simulated readings
    data_source: DataSource                    # REQUIRED — no default
    recorded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SensorReadingResponse(BaseModel):
    id: str
    bin_id: str
    device_id: Optional[str]
    fill_percent: float
    fill_liters: Optional[float]
    raw_distance_cm: Optional[float]
    data_source: DataSource
    recorded_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}
