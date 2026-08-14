"""POST /api/simulation — Ultrasonic sensor simulation engine APIs"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import random
from ...core.database import get_db, SessionLocal
from ...models.bin import Bin
from ...models.sensor_reading import SensorReading
from ...models.alert import Alert

router = APIRouter(tags=["Simulation"])

# Active simulation state dictionary
active_simulations = {}


def step_bin_simulation(bin_id: str, db: Session):
    """
    Executes one step of ultrasonic fill-level simulation:
    - Distance measured from top of bin (smaller distance = fuller bin).
    - Bin height default: 50.0 cm.
    - Increment fill percentage by +0.5% to +3.5% with realistic variance.
    - Calculate raw_distance_cm = bin_height * (1.0 - fill_pct/100.0).
    - Save reading with data_source = "SIMULATED".
    - Auto-generate threshold alerts (80%+ -> Almost Full, 95%+ -> Critical).
    """
    bin_obj = db.query(Bin).filter(Bin.id == bin_id).first()
    if not bin_obj:
        return None

    # Calculate next fill percentage with small incremental step
    current = bin_obj.current_fill_pct
    if current >= 98.0:
        # High fill condition - small bounce or stays near full
        new_fill = 98.0 + random.uniform(-0.5, 0.5)
    else:
        # Increase fill level incrementally (+0.8% to +3.2%)
        increment = random.uniform(0.8, 3.2)
        new_fill = min(100.0, current + increment)

    bin_height_cm = 50.0
    raw_distance = round(bin_height_cm * (1.0 - (new_fill / 100.0)), 1)
    fill_liters = round((new_fill / 100.0) * bin_obj.capacity_liters, 1)

    # Update bin state
    bin_obj.current_fill_pct = round(new_fill, 1)
    bin_obj.data_source = "SIMULATED"
    bin_obj.updated_at = datetime.now(timezone.utc)

    # Insert sensor reading into database (SOURCE OF TRUTH)
    reading = SensorReading(
        bin_id=bin_obj.id,
        device_id=bin_obj.device_id,
        fill_percent=round(new_fill, 1),
        fill_liters=fill_liters,
        raw_distance_cm=raw_distance,
        data_source="SIMULATED",
        recorded_at=datetime.now(timezone.utc),
    )
    db.add(reading)

    # Threshold alerts check
    if new_fill >= 95.0 and current < 95.0:
        db.add(Alert(
            alert_type="BIN_FULL",
            severity="CRITICAL",
            title="Bin Critical Fill Level",
            message=f"{bin_obj.id} ({bin_obj.label}) reached CRITICAL fill level {new_fill:.1f}%. Immediate pickup required.",
            entity_type="BIN",
            bin_id=bin_obj.id,
        ))
    elif new_fill >= 80.0 and current < 80.0:
        db.add(Alert(
            alert_type="BIN_ALMOST_FULL",
            severity="WARNING",
            title="Bin Almost Full",
            message=f"{bin_obj.id} ({bin_obj.label}) reached ALMOST FULL level {new_fill:.1f}%. Schedule collection.",
            entity_type="BIN",
            bin_id=bin_obj.id,
        ))

    db.commit()
    db.refresh(reading)
    return reading


@router.post("/bins/{bin_id}/start")
def start_bin_simulation(bin_id: str, db: Session = Depends(get_db)):
    """POST /api/simulation/bins/{bin_id}/start — Activate simulation for a specific bin."""
    bin_obj = db.query(Bin).filter(Bin.id == bin_id).first()
    if not bin_obj:
        raise HTTPException(status_code=404, detail="Bin not found")

    reading = step_bin_simulation(bin_id, db)
    active_simulations[bin_id] = True
    return {
        "status": "started",
        "bin_id": bin_id,
        "current_fill_pct": bin_obj.current_fill_pct,
        "data_source": "SIMULATED",
        "message": f"Simulation active for {bin_id}",
    }


@router.post("/bins/{bin_id}/stop")
def stop_bin_simulation(bin_id: str, db: Session = Depends(get_db)):
    """POST /api/simulation/bins/{bin_id}/stop — Pause simulation for a specific bin."""
    active_simulations[bin_id] = False
    return {"status": "stopped", "bin_id": bin_id, "message": f"Simulation paused for {bin_id}"}


@router.post("/bins/{bin_id}/reset")
def reset_bin_simulation(bin_id: str, db: Session = Depends(get_db)):
    """POST /api/simulation/bins/{bin_id}/reset — Reset bin fill level to 5%."""
    bin_obj = db.query(Bin).filter(Bin.id == bin_id).first()
    if not bin_obj:
        raise HTTPException(status_code=404, detail="Bin not found")

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

    return {
        "status": "reset",
        "bin_id": bin_id,
        "current_fill_pct": 5.0,
        "data_source": "SIMULATED",
        "message": f"Bin {bin_id} reset to 5% fill level",
    }


@router.post("/step-all")
def step_all_simulations(db: Session = Depends(get_db)):
    """Triggers one telemetry step across all active bins in the database."""
    bins = db.query(Bin).filter(Bin.status == "ONLINE").all()
    updated = []
    for b in bins:
        r = step_bin_simulation(b.id, db)
        if r:
            updated.append({"bin_id": b.id, "fill_pct": b.current_fill_pct, "distance_cm": r.raw_distance_cm})
    return {"status": "ok", "updated_bins": updated, "timestamp": datetime.now(timezone.utc).isoformat()}
