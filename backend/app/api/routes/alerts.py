"""GET|PUT /api/alerts — Centralized Alert Engine & Resolution APIs"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List, Optional
from ...core.database import get_db
from ...models.alert import Alert

router = APIRouter(tags=["Alerts"])


def create_system_alert(
    db: Session,
    alert_type: str,
    severity: str,
    title: str,
    message: str,
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
) -> Optional[Alert]:
    """
    Duplicate Prevention Engine:
    Checks if an ACTIVE alert of the same type and entity already exists.
    If an ACTIVE alert exists, returns existing alert without creating duplicate.
    """
    existing = (
        db.query(Alert)
        .filter(
            Alert.alert_type == alert_type,
            Alert.status == "ACTIVE",
            Alert.related_entity_id == entity_id if entity_id else True,
        )
        .first()
    )
    if existing:
        return existing

    new_alert = Alert(
        alert_type=alert_type,
        severity=severity,
        title=title,
        message=message,
        entity_type=entity_type,
        related_entity=entity_type,
        related_entity_id=entity_id,
        status="ACTIVE",
        created_at=datetime.now(timezone.utc),
    )
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)
    return new_alert


@router.get("")
def get_alerts(
    status: Optional[str] = Query("ACTIVE", description="Filter by status ACTIVE or RESOLVED or ALL"),
    severity: Optional[str] = Query(None, description="Filter INFO, WARNING, CRITICAL"),
    entity_type: Optional[str] = Query(None, description="Filter BIN, PICKUP, VEHICLE, DEVICE"),
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """GET /api/alerts — Fetch centralized alert list with filters."""
    query = db.query(Alert)

    if status and status != "ALL":
        query = query.filter(Alert.status == status)

    if severity and severity != "ALL":
        query = query.filter(Alert.severity == severity)

    if entity_type and entity_type != "ALL":
        query = query.filter((Alert.entity_type == entity_type) | (Alert.related_entity == entity_type))

    alerts = query.order_by(Alert.created_at.desc()).limit(limit).all()
    return alerts


@router.put("/{id}/resolve")
def resolve_alert(id: str, db: Session = Depends(get_db)):
    """
    PUT /api/alerts/{id}/resolve — Mark single alert as RESOLVED.
    Updates status to RESOLVED and records resolved_at timestamp.
    """
    alert = db.query(Alert).filter(Alert.id == id).first()
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert '{id}' not found")

    now = datetime.now(timezone.utc)
    alert.status = "RESOLVED"
    alert.resolved = True
    alert.resolved_at = now
    db.commit()
    db.refresh(alert)
    return alert


@router.post("/resolve-all")
def resolve_all_alerts(db: Session = Depends(get_db)):
    """POST /api/alerts/resolve-all — Resolve all active alerts."""
    now = datetime.now(timezone.utc)
    active_alerts = db.query(Alert).filter(Alert.status == "ACTIVE").all()
    for a in active_alerts:
        a.status = "RESOLVED"
        a.resolved = True
        a.resolved_at = now
    db.commit()
    return {"message": f"Resolved {len(active_alerts)} active alerts", "resolved_count": len(active_alerts)}
