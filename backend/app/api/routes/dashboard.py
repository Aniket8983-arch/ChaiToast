"""GET /api/dashboard — Dashboard overview and analytical summary endpoints"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from ...core.database import get_db
from ...models.bin import Bin
from ...models.alert import Alert
from ...models.pickup import Pickup
from ...models.vehicle import Vehicle
from ...models.classification_history import ClassificationHistory
from ...schemas.common import HealthResponse
from ...core.config import settings

router = APIRouter(tags=["Dashboard"])


@router.get("/summary")
@router.get("/overview")
def get_dashboard_summary(db: Session = Depends(get_db)):
    """
    Returns complete dashboard KPI summary calculated dynamically from live database records:
    1. Total waste (sum of waste collected across all history)
    2. Today's waste (today's classification volume in liters)
    3. Biodegradable waste count & percentage
    4. Non-biodegradable waste count & percentage
    5. Recycling/segregation rate %
    6. Active pickups count
    7. Available vehicles count
    8. Bins near full count (>= 80% fill)
    """
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

    # 1. Bins statistics
    bins = db.query(Bin).all()
    total_bins = len(bins)
    bins_online = sum(1 for b in bins if b.status == "ONLINE")
    bins_near_full = sum(1 for b in bins if b.current_fill_pct >= 80.0)
    bins_critical = sum(1 for b in bins if b.current_fill_pct >= 90.0)

    # 2. Pickups & Jobs statistics
    pickups = db.query(Pickup).all()
    active_pickups = sum(1 for p in pickups if p.status in ["EN_ROUTE", "ARRIVED", "COLLECTING"])
    completed_pickups = sum(1 for p in pickups if p.status == "COMPLETED")

    # Total waste volume collected (estimated from completed pickups & classifications)
    total_waste_collected_l = sum((p.waste_collected_liters or 0.0) for p in pickups if p.status == "COMPLETED")

    # 3. Fleet vehicles statistics
    vehicles = db.query(Vehicle).all()
    vehicles_available = sum(1 for v in vehicles if v.status == "AVAILABLE")

    # 4. Classifications today & all time
    today_clf = db.query(ClassificationHistory).filter(
        ClassificationHistory.classified_at >= today_start
    ).all()
    all_clf = db.query(ClassificationHistory).all()

    today_bio = sum(1 for c in today_clf if c.label == "BIO")
    today_nonbio = sum(1 for c in today_clf if c.label == "NONBIO")
    all_bio = sum(1 for c in all_clf if c.label == "BIO")
    all_nonbio = sum(1 for c in all_clf if c.label == "NONBIO")
    total_scans = len(all_clf)

    # Today's estimated waste (12L per scan average)
    today_waste_liters = len(today_clf) * 12.0

    # Segregation / recycling rate calculation
    segregation_rate = round(all_bio / total_scans * 100, 1) if total_scans > 0 else 65.0

    # 5. Active unresolved alerts
    unresolved_alerts = db.query(Alert).filter(Alert.resolved == False).count()  # noqa: E712

    return {
        "total_waste_liters": round(total_waste_collected_l + (total_scans * 12.0), 1),
        "today_waste_liters": round(today_waste_liters, 1),
        "biodegradable_count": all_bio,
        "non_biodegradable_count": all_nonbio,
        "recycling_rate": segregation_rate,
        "active_pickups": active_pickups,
        "completed_pickups": completed_pickups,
        "available_vehicles": vehicles_available,
        "total_vehicles": len(vehicles),
        "bins_near_full": bins_near_full,
        "bins_critical": bins_critical,
        "total_bins": total_bins,
        "bins_online": bins_online,
        "today_classifications": len(today_clf),
        "today_bio_count": today_bio,
        "today_nonbio_count": today_nonbio,
        "unresolved_alerts": unresolved_alerts,
        "simulation_active": settings.SIMULATION_ENABLED,
        "as_of": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/recent-activity")
def get_recent_activity(limit: int = 10, db: Session = Depends(get_db)):
    """Returns stream of recent AI classifications and alert events."""
    classifications = (
        db.query(ClassificationHistory)
        .order_by(ClassificationHistory.classified_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": c.id,
            "type": "CLASSIFICATION",
            "label": c.label,
            "display_label": "BIODEGRADABLE" if c.label == "BIO" else "NON-BIODEGRADABLE",
            "confidence": c.confidence,
            "filename": c.image_filename,
            "timestamp": c.classified_at.isoformat() if c.classified_at else None,
        }
        for c in classifications
    ]


@router.get("/waste-trends")
def get_waste_trends(days: int = 7, db: Session = Depends(get_db)):
    """Returns daily waste classification volume trends."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    records = db.query(ClassificationHistory).filter(
        ClassificationHistory.classified_at >= cutoff
    ).all()

    by_date: dict = {}
    for r in records:
        date_str = r.classified_at.strftime("%Y-%m-%d") if r.classified_at else "unknown"
        if date_str not in by_date:
            by_date[date_str] = {"date": date_str, "bio": 0, "nonbio": 0, "total": 0}
        by_date[date_str]["total"] += 1
        if r.label == "BIO":
            by_date[date_str]["bio"] += 1
        else:
            by_date[date_str]["nonbio"] += 1

    return {"data": sorted(by_date.values(), key=lambda x: x["date"]), "period_days": days}


@router.get("/category-distribution")
def get_category_distribution(db: Session = Depends(get_db)):
    """Returns overall biodegradable vs non-biodegradable breakdown."""
    all_records = db.query(ClassificationHistory).all()
    bio = sum(1 for r in all_records if r.label == "BIO")
    nonbio = sum(1 for r in all_records if r.label == "NONBIO")
    total = len(all_records)

    return {
        "total": total,
        "biodegradable": bio,
        "non_biodegradable": nonbio,
        "biodegradable_pct": round(bio / total * 100, 1) if total else 0.0,
        "non_biodegradable_pct": round(nonbio / total * 100, 1) if total else 0.0,
    }


@router.get("/alerts")
def get_dashboard_alerts(limit: int = 6, db: Session = Depends(get_db)):
    """Returns top active unresolved alerts for the dashboard."""
    alerts = (
        db.query(Alert)
        .filter(Alert.resolved == False)  # noqa: E712
        .order_by(Alert.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": a.id,
            "title": a.title,
            "message": a.message,
            "severity": a.severity,
            "alert_type": a.alert_type,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        }
        for a in alerts
    ]


@router.get("/upcoming-pickups")
def get_upcoming_pickups(limit: int = 6, db: Session = Depends(get_db)):
    """Returns upcoming and active pickups for the dashboard."""
    pickups = (
        db.query(Pickup)
        .order_by(Pickup.scheduled_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": p.id,
            "bin_id": p.bin_id,
            "zone": p.zone or "Zone A",
            "status": p.status,
            "priority": p.priority,
            "fill_before_pct": p.fill_before_pct or 85.0,
            "scheduled_at": p.scheduled_at.isoformat() if p.scheduled_at else None,
        }
        for p in pickups
    ]


@router.get("/health", response_model=HealthResponse)
def health_check(db: Session = Depends(get_db)):
    """System health check."""
    try:
        db.execute(func.now())
        db_status = "connected"
    except Exception:
        db_status = "error"

    return HealthResponse(
        status="ok",
        version=settings.APP_VERSION,
        database=db_status,
        simulation_active=settings.SIMULATION_ENABLED,
        as_of=datetime.now(timezone.utc),
    )
