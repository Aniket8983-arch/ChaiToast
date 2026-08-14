"""
SmartWaste 360 — Seed Data Service
Populates the database with realistic initial data on first launch.
Called at startup only when the bins table is empty.
"""
from datetime import datetime, timezone, timedelta
import random
from sqlalchemy.orm import Session
from ..models.bin import Bin
from ..models.device_status import DeviceStatus
from ..models.vehicle import Vehicle
from ..models.driver import Driver
from ..models.classification_history import ClassificationHistory
from ..models.alert import Alert
from ..models.user import User
import hashlib
import binascii

def hash_password(password: str) -> str:
    salt = b"smartwaste360_salt"
    dk = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    return binascii.hexlify(dk).decode('utf-8')


BINS_SEED = [
    {"id": "BIN-001", "label": "Block A — Main Entrance", "zone": "Zone A",
     "category": "BIO",    "capacity_liters": 60, "location_lat": 18.5204, "location_lng": 73.8567,
     "location_address": "Block A, Ground Floor", "current_fill_pct": 42.0},
    {"id": "BIN-002", "label": "Block A — Rear Exit",    "zone": "Zone A",
     "category": "NONBIO", "capacity_liters": 60, "location_lat": 18.5208, "location_lng": 73.8570,
     "location_address": "Block A, Rear", "current_fill_pct": 67.0},
    {"id": "BIN-003", "label": "Canteen — Left",         "zone": "Zone B",
     "category": "BIO",    "capacity_liters": 80, "location_lat": 18.5211, "location_lng": 73.8575,
     "location_address": "Canteen Building", "current_fill_pct": 85.0, "status": "ONLINE"},
    {"id": "BIN-004", "label": "Canteen — Right",        "zone": "Zone B",
     "category": "MIXED",  "capacity_liters": 80, "location_lat": 18.5213, "location_lng": 73.8578,
     "location_address": "Canteen Building", "current_fill_pct": 23.0},
    {"id": "BIN-005", "label": "Parking Lot — North",   "zone": "Zone C",
     "category": "NONBIO", "capacity_liters": 100,"location_lat": 18.5220, "location_lng": 73.8580,
     "location_address": "North Parking", "current_fill_pct": 55.0},
    {"id": "BIN-006", "label": "Workshop — Main",        "zone": "Zone C",
     "category": "NONBIO", "capacity_liters": 120,"location_lat": 18.5225, "location_lng": 73.8585,
     "location_address": "Workshop Block", "current_fill_pct": 12.0},
    {"id": "BIN-007", "label": "Common Area — Central",  "zone": "Zone D",
     "category": "MIXED",  "capacity_liters": 60, "location_lat": 18.5215, "location_lng": 73.8560,
     "location_address": "Central Common Area", "current_fill_pct": 91.0},
    {"id": "BIN-008", "label": "Corridor — Block B",     "zone": "Zone D",
     "category": "BIO",    "capacity_liters": 40, "location_lat": 18.5218, "location_lng": 73.8555,
     "location_address": "Block B Corridor", "current_fill_pct": 0.0,
     "status": "OFFLINE"},
]

VEHICLES_SEED = [
    {"registration": "MH-12-AB-1234", "vehicle_type": "COMPACT",
     "capacity_liters": 300, "current_load_liters": 0, "status": "AVAILABLE",
     "location_lat": 18.5200, "location_lng": 73.8550, "fuel_percent": 88.0},
    {"registration": "MH-12-CD-5678", "vehicle_type": "MEDIUM",
     "capacity_liters": 500, "current_load_liters": 120, "status": "EN_ROUTE",
     "location_lat": 18.5212, "location_lng": 73.8572, "fuel_percent": 72.0},
    {"registration": "MH-12-EF-9012", "vehicle_type": "MEDIUM",
     "capacity_liters": 500, "current_load_liters": 0, "status": "AVAILABLE",
     "location_lat": 18.5200, "location_lng": 73.8552, "fuel_percent": 95.0},
    {"registration": "MH-12-GH-3456", "vehicle_type": "LARGE",
     "capacity_liters": 1000,"current_load_liters": 0, "status": "MAINTENANCE",
     "location_lat": 18.5195, "location_lng": 73.8545, "fuel_percent": 45.0},
]

DRIVERS_SEED = [
    {"name": "Arjun Sharma",  "phone": "+91-98765-43210", "license_number": "MH-2023-001", "status": "ON_DUTY",  "compliance_score": 96.5},
    {"name": "Priya Patel",   "phone": "+91-98765-43211", "license_number": "MH-2023-002", "status": "ON_DUTY",  "compliance_score": 91.2},
    {"name": "Ravi Kumar",    "phone": "+91-98765-43212", "license_number": "MH-2023-003", "status": "OFF_DUTY", "compliance_score": 88.0},
    {"name": "Meena Singh",   "phone": "+91-98765-43213", "license_number": "MH-2023-004", "status": "ON_LEAVE", "compliance_score": 94.7},
    {"name": "Suresh Nair",   "phone": "+91-98765-43214", "license_number": "MH-2023-005", "status": "ON_DUTY",  "compliance_score": 82.3},
]


def seed_database(db: Session) -> None:
    """Seed all initial data. Called only when DB is empty."""
    # Seed Users first
    if db.query(User).count() == 0:
        print("[SEED] Seeding default users (admin, operator)...")
        db.add(User(
            username="admin",
            email="admin@smartwaste360.com",
            name="Admin Operator",
            hashed_password=hash_password("admin123"),
            role="ADMIN",
            is_active=True
        ))
        db.add(User(
            username="operator",
            email="operator@smartwaste360.com",
            name="Field Operator",
            hashed_password=hash_password("operator123"),
            role="OPERATOR",
            is_active=True
        ))
        db.commit()

    if db.query(Bin).count() > 0:
        return  # Already seeded

    print("[SEED] Seeding initial SmartWaste 360 data...")

    # Device status records
    devices = []
    for i in range(1, 9):
        dev = DeviceStatus(
            device_label=f"ESP32-{i:03d}",
            device_type="ESP32_WROOM",
            serial_port="COM4" if i == 1 else None,
            sensor_mode="SIMULATED",
            status="ONLINE" if i != 8 else "OFFLINE",
            firmware_version="1.0.0",
        )
        db.add(dev)
        devices.append(dev)
    db.flush()

    # Bins
    for i, b in enumerate(BINS_SEED):
        bin_obj = Bin(
            id=b["id"],
            label=b["label"],
            zone=b["zone"],
            category=b["category"],
            capacity_liters=b["capacity_liters"],
            current_fill_pct=b.get("current_fill_pct", 0.0),
            status=b.get("status", "ONLINE"),
            location_lat=b["location_lat"],
            location_lng=b["location_lng"],
            location_address=b.get("location_address"),
            device_id=devices[i].id,
        )
        db.add(bin_obj)

    # Vehicles
    for v in VEHICLES_SEED:
        vehicle = Vehicle(
            registration=v["registration"],
            vehicle_type=v["vehicle_type"],
            capacity_liters=v["capacity_liters"],
            current_load_liters=v["current_load_liters"],
            status=v["status"],
            location_lat=v["location_lat"],
            location_lng=v["location_lng"],
            location_source="SIMULATED",
            fuel_percent=v["fuel_percent"],
        )
        db.add(vehicle)

    # Drivers
    for d in DRIVERS_SEED:
        driver = Driver(
            name=d["name"],
            phone=d["phone"],
            license_number=d["license_number"],
            status=d["status"],
            compliance_score=d["compliance_score"],
        )
        db.add(driver)

    db.flush()

    # Historical classification records (last 48 hours)
    bin_ids = [b["id"] for b in BINS_SEED[:6]]
    labels = ["BIO", "NONBIO"]
    now = datetime.now(timezone.utc)

    for i in range(50):
        hours_ago = random.uniform(0, 48)
        clf_label = random.choice(labels)
        raw = random.uniform(0.05, 0.45) if clf_label == "BIO" else random.uniform(0.55, 0.98)
        confidence = (1 - raw) if clf_label == "BIO" else raw
        db.add(ClassificationHistory(
            bin_id=random.choice(bin_ids),
            label=clf_label,
            confidence=round(confidence, 4),
            raw_score=round(raw, 4),
            image_filename=f"sample_{i:03d}.jpg",
            hardware_sent=random.random() > 0.2,
            hardware_command="B" if clf_label == "BIO" else "N",
            hardware_mode="SIMULATED",
            classified_at=now - timedelta(hours=hours_ago),
        ))

    # Initial alerts (3 active)
    db.add(Alert(
        alert_type="BIN_ALMOST_FULL",
        severity="WARNING",
        title="Bin Almost Full",
        message="BIN-003 (Canteen Left) is at 85% capacity. Schedule collection soon.",
        entity_type="BIN",
        bin_id="BIN-003",
    ))
    db.add(Alert(
        alert_type="BIN_FULL",
        severity="CRITICAL",
        title="Bin Full",
        message="BIN-007 (Common Area) is at 91% — immediate collection required.",
        entity_type="BIN",
        bin_id="BIN-007",
    ))
    db.add(Alert(
        alert_type="BIN_OFFLINE",
        severity="WARNING",
        title="Device Offline",
        message="BIN-008 (Block B Corridor) is offline. Check ESP32-008 connection.",
        entity_type="BIN",
        bin_id="BIN-008",
    ))

    db.commit()
    print("[SEED] [OK] Seeding complete - 8 bins, 4 vehicles, 5 drivers, 50 classifications, 3 alerts, 2 users")
