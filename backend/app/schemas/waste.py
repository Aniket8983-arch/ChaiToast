"""Waste classification Pydantic schemas"""
from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime


class ClassificationResponse(BaseModel):
    id: str
    label: Literal["BIO", "NONBIO"]
    display_label: str                                   # "BIODEGRADABLE" or "NON-BIODEGRADABLE"
    confidence: float = Field(ge=0.0, le=1.0)
    raw_score: float
    image_filename: Optional[str] = None
    hardware_sent: bool = False
    hardware_command: Optional[str] = None
    hardware_mode: str = "SIMULATED"
    bin_id: Optional[str] = None
    classified_at: datetime
    model_status: str = "waste_model.h5 connected"       # "waste_model.h5 connected"
    classification_status: str = "Completed"             # "Completed"

    model_config = {"from_attributes": True}


class ClassificationSummary(BaseModel):
    total_today: int
    bio_count: int
    nonbio_count: int
    avg_confidence: float
    hardware_sends_today: int
