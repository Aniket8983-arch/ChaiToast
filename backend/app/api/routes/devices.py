"""GET|POST|PUT /api/devices — IoT Device Management & Sensor Telemetry Node Registry"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List, Optional
from ...core.database import get_db
from ...models.device_status import DeviceStatus

router = APIRouter(tags=["Devices"])


@router.get("")
def get_devices(db: Session = Depends(get_db)):
    """
    GET /api/devices — List all registered hardware & simulated IoT devices.
    Enforces contract: Ultrasonic sensor is marked status="SIMULATION", data_source="SIMULATED".
    """
    devices = db.query(DeviceStatus).order_by(DeviceStatus.id.asc()).all()

    # Format JSON response ensuring strict compliance with prototype specifications
    res = []
    for d in devices:
        res.append({
            "id": d.id,
            "device_id": d.id,
            "device_name": d.device_label,
            "device_type": d.device_type,
            "bin_id": d.bin.id if d.bin else None,
            "associated_bin": d.bin.label if d.bin else "Unassigned",
            "connection_status": d.status,
            "last_seen": (d.last_seen or d.created_at).isoformat(),
            "firmware_version": d.firmware_version,
            "data_source": d.sensor_mode,
            "sensor_mode": d.sensor_mode,
            "serial_port": d.serial_port,
            "baud_rate": d.baud_rate,
            "uptime_seconds": d.uptime_seconds,
            "total_commands": d.total_commands,
        })
    return res


@router.get("/{id}")
def get_device(id: str, db: Session = Depends(get_db)):
    """GET /api/devices/{id} — Fetch single device details."""
    d = db.query(DeviceStatus).filter(DeviceStatus.id == id).first()
    if not d:
        raise HTTPException(status_code=404, detail=f"Device '{id}' not found")

    return {
        "id": d.id,
        "device_id": d.id,
        "device_name": d.device_label,
        "device_type": d.device_type,
        "bin_id": d.bin.id if d.bin else None,
        "connection_status": d.status,
        "last_seen": (d.last_seen or d.created_at).isoformat(),
        "firmware_version": d.firmware_version,
        "data_source": d.sensor_mode,
    }


@router.post("", status_code=status.HTTP_201_CREATED)
def create_device(data: dict, db: Session = Depends(get_db)):
    """POST /api/devices — Register a new device in database."""
    new_d = DeviceStatus(
        device_label=data.get("device_name") or data.get("device_label") or "New IoT Node",
        device_type=data.get("device_type", "ESP32"),
        firmware_version=data.get("firmware_version", "v1.0.0"),
        sensor_mode=data.get("data_source", "SIMULATED"),
        status=data.get("connection_status", "ONLINE"),
        serial_port=data.get("serial_port", "COM3"),
    )
    db.add(new_d)
    db.commit()
    db.refresh(new_d)
    return new_d


@router.put("/{id}")
def update_device(id: str, updates: dict, db: Session = Depends(get_db)):
    """PUT /api/devices/{id} — Update device configuration or connection status."""
    d = db.query(DeviceStatus).filter(DeviceStatus.id == id).first()
    if not d:
        raise HTTPException(status_code=404, detail=f"Device '{id}' not found")

    if "connection_status" in updates or "status" in updates:
        d.status = updates.get("connection_status") or updates.get("status")
    if "device_name" in updates:
        d.device_label = updates["device_name"]
    if "data_source" in updates:
        d.sensor_mode = updates["data_source"]

    d.last_seen = datetime.now(timezone.utc)
    db.commit()
    db.refresh(d)
    return d
