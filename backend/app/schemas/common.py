"""
SmartWaste 360 — Common Pydantic Schemas
Shared base types and response wrappers used across all API groups.
"""
from pydantic import BaseModel
from typing import TypeVar, Generic, List, Optional
from datetime import datetime

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int


class MessageResponse(BaseModel):
    message: str
    success: bool = True


class HealthResponse(BaseModel):
    status: str
    version: str
    database: str
    simulation_active: bool
    as_of: datetime
