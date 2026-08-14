"""GET /api/compliance — Operational Compliance Engine & Audit Reports API"""
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
import csv, io
from typing import Optional
from ...core.database import get_db
from ...models.bin import Bin
from ...models.pickup import Pickup
from ...models.alert import Alert
from ...models.classification_history import ClassificationHistory

router = APIRouter(tags=["Compliance"])


@router.get("/summary")
def get_compliance_summary(
    range_filter: str = Query("LAST_30_DAYS", alias="range"),
    establishment: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """
    GET /api/compliance/summary — Calculates operational compliance scores directly from database records.
    (No government regulations claimed; purely application-level operational compliance).
    """
    # 1. Segregation Rate Calculation
    all_scans = db.query(ClassificationHistory).all()
    bio_scans = sum(1 for c in all_scans if "BIO" in str(getattr(c, 'label', '')).upper() and "NON" not in str(getattr(c, 'label', '')).upper())
    total_scans = len(all_scans) or 1
    segregation_rate = round((bio_scans / total_scans) * 100.0, 1)

    # 2. Pickup Completion Rate Calculation
    all_pickups = db.query(Pickup).all()
    if establishment:
        all_pickups = [p for p in all_pickups if p.establishment and establishment.lower() in p.establishment.lower()]

    completed_pickups = sum(1 for p in all_pickups if p.status == "COMPLETED")
    total_pickups = len(all_pickups) or 1
    completion_rate = round((completed_pickups / total_pickups) * 100.0, 1)
    missed_rate = round(100.0 - completion_rate, 1)

    # 3. Bin Overflow & Alert Penalties
    critical_alerts = db.query(Alert).filter(Alert.status == "ACTIVE", Alert.severity == "CRITICAL").count()
    bin_overflow_count = db.query(Bin).filter(Bin.current_fill_pct >= 95.0).count()

    # 4. Score Aggregation
    segregation_score = min(100.0, max(0.0, segregation_rate))
    collection_score = min(100.0, max(0.0, completion_rate))
    recycling_score = round(segregation_score * 0.92, 1)
    operations_score = min(100.0, max(0.0, 100.0 - (critical_alerts * 10.0 + bin_overflow_count * 15.0)))

    overall_score = round(
        (segregation_score * 0.35) +
        (collection_score * 0.30) +
        (recycling_score * 0.15) +
        (operations_score * 0.20),
        1
    )

    # Compliance Status Categorization
    status = (
        "COMPLIANT" if overall_score >= 80.0 else
        "NEEDS ATTENTION" if overall_score >= 60.0 else
        "NON-COMPLIANT"
    )

    # Explanatory Root Cause Failure Reasons ("Why it happened")
    issues = []
    if segregation_rate < 80.0:
        issues.append(f"Segregation rate decreased to {segregation_rate}% because {total_scans - bio_scans} recent AI classification records showed mixed or non-biodegradable waste.")

    if completion_rate < 90.0:
        issues.append(f"Collection score impacted because {total_pickups - completed_pickups} scheduled pickup jobs remain incomplete.")

    if critical_alerts > 0 or bin_overflow_count > 0:
        issues.append(f"Operations score penalized due to {critical_alerts} active unresolved critical alerts and {bin_overflow_count} overflowing smart bins (>= 95% fill).")

    if not issues:
        issues.append("All operational compliance metrics meet target thresholds (80%+). No active infractions detected.")

    return {
        "overall_score": overall_score,
        "status": status,
        "metrics": {
            "segregation_rate": segregation_rate,
            "collection_completion_rate": completion_rate,
            "missed_pickup_rate": missed_rate,
            "recycling_percentage": recycling_score,
            "unresolved_critical_alerts": critical_alerts,
            "bin_overflow_events": bin_overflow_count,
        },
        "scores": {
            "segregation": segregation_score,
            "collection": collection_score,
            "recycling": recycling_score,
            "operations": operations_score,
        },
        "root_causes": issues,
        "as_of": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/issues")
def get_compliance_issues(db: Session = Depends(get_db)):
    """GET /api/compliance/issues — List all active compliance infractions and overflow events."""
    alerts = db.query(Alert).filter(Alert.status == "ACTIVE").all()
    overflow_bins = db.query(Bin).filter(Bin.current_fill_pct >= 80.0).all()

    issues = []
    for b in overflow_bins:
        issues.append({
            "id": f"ISSUE-BIN-{b.id}",
            "entity": f"Bin {b.id} ({b.label})",
            "category": "BIN_OVERFLOW",
            "severity": "CRITICAL" if b.current_fill_pct >= 95.0 else "WARNING",
            "description": f"Bin fill level reached {b.current_fill_pct}%. Threshold exceeded.",
            "timestamp": (b.updated_at or b.created_at).isoformat(),
        })

    for a in alerts:
        issues.append({
            "id": f"ISSUE-ALT-{a.id[:8]}",
            "entity": a.title,
            "category": a.alert_type,
            "severity": a.severity,
            "description": a.message,
            "timestamp": a.created_at.isoformat(),
        })

    return issues


@router.get("/export/report")
def export_compliance_report(db: Session = Depends(get_db)):
    """GET /api/compliance/export/report — Download Operational Compliance Audit Report CSV."""
    summary = get_compliance_summary(db=db)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["SmartWaste 360 Operational Compliance Audit Report"])
    writer.writerow(["Generated At", datetime.now(timezone.utc).isoformat()])
    writer.writerow(["Overall Compliance Status", summary["status"]])
    writer.writerow(["Overall Score", f"{summary['overall_score']}%"])
    writer.writerow([])

    writer.writerow(["SCORE CATEGORY", "SCORE (%)"])
    for k, v in summary["scores"].items():
        writer.writerow([k.capitalize(), f"{v}%"])

    writer.writerow([])
    writer.writerow(["ROOT CAUSES & EXPLANATORY FINDINGS"])
    for issue in summary["root_causes"]:
        writer.writerow([issue])

    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=SmartWaste360_Compliance_Report.csv"},
    )
