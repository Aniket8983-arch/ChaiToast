"""Bin Pydantic schemas"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class BinCategory(str, Enum):
    BIO = "BIO"
    NONBIO = "NONBIO"
    MIXED = "MIXED"


class BinStatus(str, Enum):
    ONLINE = "ONLINE"
    OFFLINE = "OFFLINE"
    FULL = "FULL"
    MAINTENANCE = "MAINTENANCE"


class BinBase(BaseModel):
    label: str
    location_address: Optional[str] = None
    location_lat: float
    location_lng: float
    zone: str
    category: BinCategory
    capacity_liters: float = Field(default=60.0, gt=0)


class BinCreate(BinBase):
    id: str = Field(pattern=r"^BIN-\d{3}$", description="e.g. BIN-001")


class BinUpdate(BaseModel):
    label: Optional[str] = None
    location_address: Optional[str] = None
    zone: Optional[str] = None
    category: Optional[BinCategory] = None
    capacity_liters: Optional[float] = None
    status: Optional[BinStatus] = None


class BinResponse(BinBase):
    id: str
    current_fill_pct: float
    status: BinStatus
    device_id: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = {"from_attributes": True}


class BinSummary(BaseModel):
    id: str
    label: str
    zone: str
    category: BinCategory
    current_fill_pct: float
    status: BinStatus

    model_config = {"from_attributes": True}
