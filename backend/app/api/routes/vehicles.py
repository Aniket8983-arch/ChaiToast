"""GET|POST|PUT /api/vehicles — Fleet Management & GPS Location Telemetry API"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import math, random
from typing import List, Optional
from ...core.database import get_db
from ...models.vehicle import Vehicle

router = APIRouter(tags=["Vehicles"])

# Waypoints around Pune campus area for smooth realistic movement simulation
PUNE_WAYPOINTS = [
    (18.5204, 73.8567), # Base Depot
    (18.5218, 73.8580), # Canteen Waypoint
    (18.5235, 73.8595), # IT Park Gate 1
    (18.5250, 73.8570), # Commercial Complex
    (18.5220, 73.8540), # South Block
]


@router.get("")
def get_all_vehicles(db: Session = Depends(get_db)):
    """GET /api/vehicles — Fetch all fleet vehicles from database."""
    vehicles = db.query(Vehicle).order_by(Vehicle.id.asc()).all()

    # Format JSON response with alias fields
    res = []
    for v in vehicles:
        res.append({
            "id": v.id,
            "vehicle_id": v.vehicle_id or v.id,
            "registration": v.registration,
            "registration_number": v.registration_number or v.registration,
            "vehicle_type": v.vehicle_type,
            "capacity": v.capacity,
            "capacity_liters": v.capacity_liters or v.capacity,
            "current_load": v.current_load,
            "current_load_liters": v.current_load_liters or v.current_load,
            "driver": v.driver_name or "Unassigned Driver",
            "driver_name": v.driver_name or "Unassigned Driver",
            "status": v.status,
            "latitude": v.latitude or v.location_lat or 18.5204,
            "longitude": v.longitude or v.location_lng or 73.8567,
            "last_updated": (v.location_updated_at or v.updated_at or v.created_at).isoformat(),
            "data_source": v.data_source or "SIMULATED",
            "fuel_percent": v.fuel_percent,
            "odometer_km": v.odometer_km,
        })
    return res


@router.get("/{id}")
def get_vehicle_by_id(id: str, db: Session = Depends(get_db)):
    """GET /api/vehicles/{id} — Fetch single vehicle details."""
    v = db.query(Vehicle).filter((Vehicle.id == id) | (Vehicle.vehicle_id == id)).first()
    if not v:
        raise HTTPException(status_code=404, detail=f"Vehicle '{id}' not found")

    return {
        "id": v.id,
        "vehicle_id": v.vehicle_id or v.id,
        "registration": v.registration,
        "registration_number": v.registration_number or v.registration,
        "vehicle_type": v.vehicle_type,
        "capacity": v.capacity,
        "current_load": v.current_load,
        "driver": v.driver_name or "Unassigned Driver",
        "status": v.status,
        "latitude": v.latitude or 18.5204,
        "longitude": v.longitude or 73.8567,
        "last_updated": (v.location_updated_at or v.updated_at or v.created_at).isoformat(),
        "data_source": v.data_source or "SIMULATED",
    }


@router.get("/{id}/location")
def get_vehicle_location(id: str, db: Session = Depends(get_db)):
    """GET /api/vehicles/{id}/location — Fetch live location telemetry for map tracking."""
    v = db.query(Vehicle).filter((Vehicle.id == id) | (Vehicle.vehicle_id == id)).first()
    if not v:
        raise HTTPException(status_code=404, detail=f"Vehicle '{id}' not found")

    # Smooth gradual GPS position simulation if vehicle is active
    now = datetime.now(timezone.utc)
    if v.status in ["IN_TRANSIT", "ASSIGNED", "RETURNING"]:
        t = now.timestamp() / 10.0
        idx = int(t) % len(PUNE_WAYPOINTS)
        next_idx = (idx + 1) % len(PUNE_WAYPOINTS)
        frac = t - int(t)

        lat1, lng1 = PUNE_WAYPOINTS[idx]
        lat2, lng2 = PUNE_WAYPOINTS[next_idx]

        v.latitude = round(lat1 + (lat2 - lat1) * frac, 6)
        v.longitude = round(lng1 + (lng2 - lng1) * frac, 6)
        v.location_updated_at = now
        db.commit()

    return {
        "vehicle_id": v.id,
        "registration_number": v.registration,
        "latitude": v.latitude or 18.5204,
        "longitude": v.longitude or 73.8567,
        "status": v.status,
        "speed_kmh": 28.5 if v.status == "IN_TRANSIT" else 0.0,
        "heading": 45.0,
        "last_updated": (v.location_updated_at or now).isoformat(),
        "data_source": "SIMULATED", # Core requirement: display SIMULATED LOCATION
    }


@router.post("", status_code=status.HTTP_201_CREATED)
def create_vehicle(data: dict, db: Session = Depends(get_db)):
    """POST /api/vehicles — Register a new fleet vehicle."""
    new_v = Vehicle(
        registration=data.get("registration_number") or data.get("registration") or "MH-12-XX-0000",
        registration_number=data.get("registration_number") or "MH-12-XX-0000",
        vehicle_type=data.get("vehicle_type", "MEDIUM"),
        capacity=float(data.get("capacity", 500.0)),
        capacity_liters=float(data.get("capacity", 500.0)),
        current_load=0.0,
        driver_name=data.get("driver", "Unassigned Driver"),
        status=data.get("status", "AVAILABLE"),
        latitude=18.5204,
        longitude=73.8567,
        data_source="SIMULATED",
    )
    db.add(new_v)
    db.commit()
    db.refresh(new_v)
    return new_v


@router.put("/{id}")
def update_vehicle(id: str, updates: dict, db: Session = Depends(get_db)):
    """PUT /api/vehicles/{id} — Update vehicle status, assigned driver, or capacity load."""
    v = db.query(Vehicle).filter((Vehicle.id == id) | (Vehicle.vehicle_id == id)).first()
    if not v:
        raise HTTPException(status_code=404, detail=f"Vehicle '{id}' not found")

    now = datetime.now(timezone.utc)
    if "status" in updates:
        v.status = updates["status"]
    if "driver" in updates or "driver_name" in updates:
        v.driver_name = updates.get("driver") or updates.get("driver_name")
    if "current_load" in updates:
        v.current_load = float(updates["current_load"])
        v.current_load_liters = float(updates["current_load"])
    if "capacity" in updates:
        v.capacity = float(updates["capacity"])
        v.capacity_liters = float(updates["capacity"])

    v.updated_at = now
    db.commit()
    db.refresh(v)
    return v
