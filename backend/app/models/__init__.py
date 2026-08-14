"""
SmartWaste 360 — ORM Models Package
Imports all models so they are registered with SQLAlchemy Base.
"""
from . import (
    user,
    device_status,
    bin,
    sensor_reading,
    vehicle,
    driver,
    collection_job,
    pickup,
    waste_record,
    classification_history,
    alert,
)

__all__ = [
    "user", "device_status", "bin", "sensor_reading",
    "vehicle", "driver", "collection_job", "pickup",
    "waste_record", "classification_history", "alert",
]
