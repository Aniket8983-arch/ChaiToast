"""GET|POST|PUT /api/bins — Smart Bin Registry & Sensor Readings API"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from ...core.database import get_db
from ...models.bin import Bin
from ...models.sensor_reading import SensorReading
from ...models.alert import Alert
from ...schemas.bin import BinCreate, BinUpdate, BinResponse, BinSummary
from ...schemas.sensor import SensorReadingResponse

router = APIRouter(tags=["Bins"])


@router.get("", response_model=List[BinResponse])
def get_all_bins(db: Session = Depends(get_db)):
    """GET /api/bins — List all registered smart bins from database."""
    return db.query(Bin).order_by(Bin.id.asc()).all()


@router.get("/summary", response_model=List[BinSummary])
def get_bins_summary(db: Session = Depends(get_db)):
    """GET /api/bins/summary — Lightweight list of bins for maps & dropdowns."""
    return db.query(Bin).all()


@router.get("/{bin_id}", response_model=BinResponse)
def get_bin(bin_id: str, db: Session = Depends(get_db)):
    """GET /api/bins/{bin_id} — Fetch single bin details."""
    bin_obj = db.query(Bin).filter(Bin.id == bin_id).first()
    if not bin_obj:
        raise HTTPException(status_code=404, detail=f"Bin '{bin_id}' not found in database")
    return bin_obj


@router.get("/{bin_id}/readings", response_model=List[SensorReadingResponse])
def get_bin_readings(
    bin_id: str,
    limit: int = 50,
    hours: int = 24,
    db: Session = Depends(get_db),
):
    """
    GET /api/bins/{bin_id}/readings — Time-series sensor fill-level readings.
    Used for live fill charts in the UI.
    """
    bin_obj = db.query(Bin).filter(Bin.id == bin_id).first()
    if not bin_obj:
        raise HTTPException(status_code=404, detail=f"Bin '{bin_id}' not found")

    cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
    readings = (
        db.query(SensorReading)
        .filter(SensorReading.bin_id == bin_id, SensorReading.recorded_at >= cutoff)
        .order_by(SensorReading.recorded_at.desc())
        .limit(limit)
        .all()
    )

    # Fallback: if no time-series readings yet, construct initial record from current bin state
    if not readings:
        fill_pct = bin_obj.current_fill_pct
        distance_cm = round(50.0 * (1.0 - (fill_pct / 100.0)), 1)
        fallback_reading = SensorReading(
            bin_id=bin_obj.id,
            device_id=bin_obj.device_id,
            fill_percent=fill_pct,
            fill_liters=round((fill_pct / 100.0) * bin_obj.capacity_liters, 1),
            raw_distance_cm=distance_cm,
            data_source=bin_obj.data_source,
            recorded_at=bin_obj.updated_at or datetime.now(timezone.utc),
        )
        return [fallback_reading]

    return readings


@router.post("", response_model=BinResponse, status_code=status.HTTP_201_CREATED)
def create_bin(bin_data: BinCreate, db: Session = Depends(get_db)):
    """POST /api/bins — Register a new smart bin in the database."""
    existing = db.query(Bin).filter(Bin.id == bin_data.id).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Bin ID '{bin_data.id}' already exists")

    new_bin = Bin(**bin_data.model_dump())
    db.add(new_bin)
    db.commit()
    db.refresh(new_bin)
    return new_bin


@router.put("/{bin_id}", response_model=BinResponse)
@router.patch("/{bin_id}", response_model=BinResponse)
def update_bin(bin_id: str, updates: BinUpdate, db: Session = Depends(get_db)):
    """PUT /api/bins/{bin_id} — Update smart bin attributes & status."""
    bin_obj = db.query(Bin).filter(Bin.id == bin_id).first()
    if not bin_obj:
        raise HTTPException(status_code=404, detail=f"Bin '{bin_id}' not found")

    for field, value in updates.model_dump(exclude_none=True).items():
        setattr(bin_obj, field, value)

    bin_obj.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(bin_obj)
    return bin_obj


@router.post("/{bin_id}/simulate/fill")
def simulate_fill(bin_id: str, db: Session = Depends(get_db)):
    """Simulate bin filling to 85% — creates sensor reading & generates alert if needed."""
    bin_obj = db.query(Bin).filter(Bin.id == bin_id).first()
    if not bin_obj:
        raise HTTPException(status_code=404, detail=f"Bin '{bin_id}' not found")

    bin_obj.current_fill_pct = 85.0
    bin_obj.updated_at = datetime.now(timezone.utc)

    # Save sensor reading
    reading = SensorReading(
        bin_id=bin_obj.id,
        device_id=bin_obj.device_id,
        fill_percent=85.0,
        fill_liters=round(0.85 * bin_obj.capacity_liters, 1),
        raw_distance_cm=7.5,
        data_source="SIMULATED",
        recorded_at=datetime.now(timezone.utc),
    )
    db.add(reading)

    # Check alert
    db.add(Alert(
        alert_type="BIN_ALMOST_FULL",
        severity="WARNING",
        title="Bin Almost Full",
        message=f"{bin_obj.id} ({bin_obj.label}) reached 85% capacity.",
        entity_type="BIN",
        bin_id=bin_obj.id,
    ))

    db.commit()
    return {"message": f"Bin {bin_id} fill level set to 85%", "current_fill_pct": 85.0}


@router.post("/{bin_id}/simulate/collect")
def simulate_collect(bin_id: str, db: Session = Depends(get_db)):
    """Simulate emptying bin to 5% after collection."""
    bin_obj = db.query(Bin).filter(Bin.id == bin_id).first()
    if not bin_obj:
        raise HTTPException(status_code=404, detail=f"Bin '{bin_id}' not found")

    bin_obj.current_fill_pct = 5.0
    bin_obj.updated_at = datetime.now(timezone.utc)

    reading = SensorReading(
        bin_id=bin_obj.id,
        device_id=bin_obj.device_id,
        fill_percent=5.0,
        fill_liters=round(0.05 * bin_obj.capacity_liters, 1),
        raw_distance_cm=47.5,
        data_source="SIMULATED",
        recorded_at=datetime.now(timezone.utc),
    )
    db.add(reading)
    db.commit()
    return {"message": f"Bin {bin_id} collection simulated — reset to 5%", "current_fill_pct": 5.0}
