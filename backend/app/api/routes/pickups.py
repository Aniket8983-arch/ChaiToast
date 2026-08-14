"""GET|POST|PUT /api/pickups — Collection Scheduling API"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List, Optional
from ...core.database import get_db
from ...models.pickup import Pickup
from ...models.vehicle import Vehicle
from ...models.alert import Alert

router = APIRouter(tags=["Pickups"])


@router.get("")
def get_pickups(
    search: Optional[str] = Query(None, description="Search establishment or location"),
    status: Optional[str] = Query(None, description="Filter status"),
    priority: Optional[str] = Query(None, description="Filter priority"),
    date: Optional[str] = Query(None, description="Filter scheduled date YYYY-MM-DD"),
    db: Session = Depends(get_db),
):
    """
    GET /api/pickups — List all pickups with search, status, priority, and date filters.
    """
    query = db.query(Pickup)

    if search:
        s = f"%{search}%"
        query = query.filter((Pickup.establishment.like(s)) | (Pickup.location.like(s)) | (Pickup.zone.like(s)))

    if status and status != "ALL":
        query = query.filter(Pickup.status == status)

    if priority and priority != "ALL":
        query = query.filter(Pickup.priority == priority)

    if date:
        query = query.filter(Pickup.scheduled_date == date)

    pickups = query.order_by(Pickup.created_at.desc()).all()
    return pickups


@router.get("/{id}")
def get_pickup_by_id(id: str, db: Session = Depends(get_db)):
    """GET /api/pickups/{id} — Fetch pickup details by ID."""
    pickup = db.query(Pickup).filter(Pickup.id == id).first()
    if not pickup:
        raise HTTPException(status_code=404, detail=f"Pickup '{id}' not found")
    return pickup


@router.post("", status_code=status.HTTP_201_CREATED)
def create_pickup(data: dict, db: Session = Depends(get_db)):
    """
    POST /api/pickups — Schedule a new pickup in the database.
    Updates dashboard statistics and appears immediately in upcoming pickups.
    """
    now = datetime.now(timezone.utc)
    new_pickup = Pickup(
        establishment=data.get("establishment", "Commercial Premises"),
        location=data.get("location", "Zone A"),
        zone=data.get("zone", "Zone A"),
        waste_category=data.get("waste_category", "BIO"),
        estimated_quantity=float(data.get("estimated_quantity", 50.0)),
        scheduled_date=data.get("scheduled_date", now.strftime("%Y-%m-%d")),
        scheduled_time=data.get("scheduled_time", "10:00 AM"),
        priority=data.get("priority", "MEDIUM"),
        assigned_vehicle=data.get("assigned_vehicle"),
        assigned_driver=data.get("assigned_driver"),
        vehicle_id=data.get("vehicle_id"),
        driver_id=data.get("driver_id"),
        bin_id=data.get("bin_id"),
        status="ASSIGNED" if data.get("assigned_vehicle") else "SCHEDULED",
        created_at=now,
        updated_at=now,
    )

    # If vehicle is assigned, update vehicle status to ASSIGNED / IN_TRANSIT
    if data.get("vehicle_id"):
        veh = db.query(Vehicle).filter(Vehicle.id == data.get("vehicle_id")).first()
        if veh:
            veh.status = "ASSIGNED"
            veh.updated_at = now

    db.add(new_pickup)
    db.commit()
    db.refresh(new_pickup)
    return new_pickup


@router.put("/{id}")
def update_pickup(id: str, updates: dict, db: Session = Depends(get_db)):
    """
    PUT /api/pickups/{id} — Update pickup status, vehicle assignment, or driver.
    Automatically updates vehicle status, dashboard metrics, and logs activity.
    """
    pickup = db.query(Pickup).filter(Pickup.id == id).first()
    if not pickup:
        raise HTTPException(status_code=404, detail=f"Pickup '{id}' not found")

    now = datetime.now(timezone.utc)
    for field, val in updates.items():
        if hasattr(pickup, field) and val is not None:
            setattr(pickup, field, val)

    pickup.updated_at = now

    # When status becomes IN_TRANSIT, update assigned vehicle to IN_TRANSIT
    if updates.get("status") == "IN_TRANSIT" and pickup.vehicle_id:
        veh = db.query(Vehicle).filter(Vehicle.id == pickup.vehicle_id).first()
        if veh:
            veh.status = "IN_TRANSIT"

    # When status becomes COMPLETED, update vehicle to AVAILABLE and reset bin if linked
    if updates.get("status") in ["COMPLETED", "COLLECTED"]:
        pickup.completed_at = now
        if pickup.vehicle_id:
            veh = db.query(Vehicle).filter(Vehicle.id == pickup.vehicle_id).first()
            if veh:
                veh.status = "AVAILABLE"
                veh.current_load = min(veh.capacity, veh.current_load + (pickup.estimated_quantity or 50.0))

    db.commit()
    db.refresh(pickup)
    return pickup
