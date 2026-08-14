"""POST /api/sensors — Sensor reading ingestion (SHARED contract: real + simulated)"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from typing import List
from ...core.database import get_db
from ...models.sensor_reading import SensorReading
from ...models.bin import Bin
from ...schemas.sensor import SensorReadingCreate, SensorReadingResponse

router = APIRouter(tags=["Sensors"])


@router.post("/reading", response_model=SensorReadingResponse, status_code=201)
def ingest_sensor_reading(reading: SensorReadingCreate, db: Session = Depends(get_db)):
    """
    Ingest one sensor reading.
    Used identically by the simulation service (data_source='SIMULATED')
    and real ESP32 hardware (data_source='REAL').
    """
    # Verify bin exists
    bin_obj = db.query(Bin).filter(Bin.id == reading.bin_id).first()
    if not bin_obj:
        raise HTTPException(status_code=404, detail=f"Bin {reading.bin_id} not found")

    # Auto-calculate fill_liters if not provided
    fill_liters = reading.fill_liters or (reading.fill_percent / 100.0 * bin_obj.capacity_liters)

    new_reading = SensorReading(
        bin_id=reading.bin_id,
        device_id=reading.device_id,
        fill_percent=reading.fill_percent,
        fill_liters=fill_liters,
        raw_distance_cm=reading.raw_distance_cm,
        data_source=reading.data_source.value,
        recorded_at=reading.recorded_at,
    )
    db.add(new_reading)

    # Update bin's current fill
    bin_obj.current_fill_pct = reading.fill_percent
    bin_obj.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(new_reading)
    return new_reading


@router.get("/readings", response_model=List[SensorReadingResponse])
def get_readings(
    bin_id: str | None = None,
    source: str | None = None,
    hours: int = 24,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
    q = db.query(SensorReading).filter(SensorReading.recorded_at >= cutoff)
    if bin_id:
        q = q.filter(SensorReading.bin_id == bin_id)
    if source:
        q = q.filter(SensorReading.data_source == source.upper())
    return q.order_by(SensorReading.recorded_at.desc()).limit(limit).all()


@router.get("/readings/{bin_id}/latest", response_model=SensorReadingResponse)
def get_latest_reading(bin_id: str, db: Session = Depends(get_db)):
    reading = (
        db.query(SensorReading)
        .filter(SensorReading.bin_id == bin_id)
        .order_by(SensorReading.recorded_at.desc())
        .first()
    )
    if not reading:
        raise HTTPException(status_code=404, detail=f"No readings found for bin {bin_id}")
    return reading

