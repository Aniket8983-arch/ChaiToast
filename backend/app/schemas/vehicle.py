"""Vehicle and Driver Pydantic schemas"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum


class VehicleType(str, Enum):
    COMPACT = "COMPACT"
    MEDIUM = "MEDIUM"
    LARGE = "LARGE"


class VehicleStatus(str, Enum):
    AVAILABLE = "AVAILABLE"
    ASSIGNED = "ASSIGNED"
    EN_ROUTE = "EN_ROUTE"
    COLLECTING = "COLLECTING"
    RETURNING = "RETURNING"
    OFFLINE = "OFFLINE"
    MAINTENANCE = "MAINTENANCE"


class DriverStatus(str, Enum):
    ON_DUTY = "ON_DUTY"
    OFF_DUTY = "OFF_DUTY"
    ON_LEAVE = "ON_LEAVE"


class VehicleResponse(BaseModel):
    id: str
    registration: str
    vehicle_type: VehicleType
    capacity_liters: float
    current_load_liters: float
    status: VehicleStatus
    driver_id: Optional[str]
    location_lat: Optional[float]
    location_lng: Optional[float]
    location_source: str
    location_updated_at: Optional[datetime]
    odometer_km: float
    fuel_percent: float
    created_at: datetime

    model_config = {"from_attributes": True}


class DriverResponse(BaseModel):
    id: str
    name: str
    phone: Optional[str]
    license_number: Optional[str]
    status: DriverStatus
    assigned_vehicle_id: Optional[str]
    compliance_score: float
    created_at: datetime

    model_config = {"from_attributes": True}
