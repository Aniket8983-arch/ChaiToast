"""Alert Pydantic schemas"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum


class AlertType(str, Enum):
    BIN_ALMOST_FULL = "BIN_ALMOST_FULL"
    BIN_FULL = "BIN_FULL"
    BIN_OFFLINE = "BIN_OFFLINE"
    MISSED_PICKUP = "MISSED_PICKUP"
    DELAYED_PICKUP = "DELAYED_PICKUP"
    VEHICLE_UNAVAILABLE = "VEHICLE_UNAVAILABLE"
    LOW_CONFIDENCE_SCAN = "LOW_CONFIDENCE_SCAN"
    DEVICE_OFFLINE = "DEVICE_OFFLINE"


class AlertSeverity(str, Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"


class AlertResponse(BaseModel):
    id: str
    alert_type: AlertType
    severity: AlertSeverity
    title: str
    message: str
    entity_type: Optional[str]
    bin_id: Optional[str]
    vehicle_id: Optional[str]
    device_id: Optional[str]
    job_id: Optional[str]
    acknowledged: bool
    acknowledged_at: Optional[datetime]
    resolved: bool
    resolved_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


class AlertCountResponse(BaseModel):
    total_unresolved: int
    info: int
    warning: int
    critical: int
