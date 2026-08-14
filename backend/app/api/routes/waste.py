"""POST /api/waste — AI waste classification using existing models/waste_model.h5"""
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from typing import List, Optional
import hashlib
import io
from pathlib import Path
from PIL import Image
import numpy as np

from ...core.database import get_db
from ...models.classification_history import ClassificationHistory
from ...schemas.waste import ClassificationResponse, ClassificationSummary

router = APIRouter(tags=["Waste"])

# Global singleton model instance
_model_instance = None
_model_error = None


def get_waste_model():
    """Load models/waste_model.h5 lazily as a singleton."""
    global _model_instance, _model_error
    if _model_instance is not None:
        return _model_instance
    if _model_error is not None:
        raise HTTPException(status_code=500, detail=f"Model loading error: {_model_error}")

    try:
        import tensorflow as tf
        model_path = Path(__file__).parents[4] / "models" / "waste_model.h5"
        if not model_path.exists():
            # Try CWD fallback
            model_path = Path("models/waste_model.h5").resolve()
        
        print(f"[AI MODEL] Loading {model_path}...")
        _model_instance = tf.keras.models.load_model(str(model_path))
        print("[AI MODEL] [OK] waste_model.h5 loaded successfully!")
        return _model_instance
    except Exception as e:
        _model_error = str(e)
        print(f"[AI MODEL ERROR] Failed to load model: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to load waste_model.h5: {e}")


def predict_waste_image(image: Image.Image):
    """
    Preserves exact preprocessing and inference logic from src/predict.py:
    1. Resize image to 224x224
    2. Normalize array by 255.0
    3. Expand dims to (1, 224, 224, 3)
    4. Run sigmoid prediction
    5. > 0.5 => NONBIO (NON-BIODEGRADABLE), else => BIO (BIODEGRADABLE)
    """
    model = get_waste_model()
    IMG_SIZE = 224

    img = image.convert("RGB").resize((IMG_SIZE, IMG_SIZE))
    img_array = np.array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)

    prediction = float(model.predict(img_array, verbose=0)[0][0])

    if prediction > 0.5:
        label = "NONBIO"
        display_label = "NON-BIODEGRADABLE"
        confidence = prediction
    else:
        label = "BIO"
        display_label = "BIODEGRADABLE"
        confidence = 1.0 - prediction

    return {
        "label": label,
        "display_label": display_label,
        "confidence": round(confidence, 4),
        "raw_score": round(prediction, 4),
    }


@router.post("/classify", response_model=ClassificationResponse, status_code=201)
async def classify_waste(
    file: UploadFile = File(...),
    bin_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Upload captured waste image -> Run waste_model.h5 -> Save result in database.
    Security Audit Validations:
    - Max 10 MB payload limit
    - Content-type validation
    - Path traversal sanitization
    - PIL integrity check
    """
    ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if file.content_type and file.content_type.lower() not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid image format '{file.content_type}'. Allowed: JPEG, PNG, WEBP."
        )

    contents = await file.read()

    # 10 MB Max File Size Limit
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size exceeds maximum allowed limit of 10 MB."
        )

    # Path traversal protection on filename
    safe_filename = Path(file.filename or "camera_capture.jpg").name
    image_hash = hashlib.sha256(contents).hexdigest()

    try:
        pil_image = Image.open(io.BytesIO(contents))
        pil_image.verify() # Integrity check
        pil_image = Image.open(io.BytesIO(contents)) # Re-open after verify
        result = predict_waste_image(pil_image)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Uploaded image is corrupt or invalid: {str(e)}"
        )

    hardware_command = "B" if result["label"] == "BIO" else "N"

    record = ClassificationHistory(
        bin_id=bin_id,
        label=result["label"],
        confidence=result["confidence"],
        raw_score=result["raw_score"],
        image_filename=safe_filename,
        image_hash=image_hash,
        hardware_command=hardware_command,
        hardware_sent=False,
        hardware_mode="SIMULATED",
        classified_at=datetime.now(timezone.utc),
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return ClassificationResponse(
        id=record.id,
        label=record.label,
        display_label=result["display_label"],
        confidence=record.confidence,
        raw_score=record.raw_score,
        image_filename=record.image_filename,
        hardware_sent=record.hardware_sent,
        hardware_command=record.hardware_command,
        hardware_mode=record.hardware_mode,
        bin_id=record.bin_id,
        classified_at=record.classified_at,
        model_status="waste_model.h5 connected",
        classification_status="Completed",
    )


@router.get("/history", response_model=List[ClassificationResponse])
def get_classification_history(
    label: Optional[str] = None,
    hours: int = 24,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
    q = db.query(ClassificationHistory).filter(
        ClassificationHistory.classified_at >= cutoff
    )
    if label:
        q = q.filter(ClassificationHistory.label == label.upper())
    records = q.order_by(ClassificationHistory.classified_at.desc()).limit(limit).all()

    return [
        ClassificationResponse(
            id=r.id,
            label=r.label,
            display_label="BIODEGRADABLE" if r.label == "BIO" else "NON-BIODEGRADABLE",
            confidence=r.confidence,
            raw_score=r.raw_score,
            image_filename=r.image_filename,
            hardware_sent=r.hardware_sent,
            hardware_command=r.hardware_command,
            hardware_mode=r.hardware_mode,
            bin_id=r.bin_id,
            classified_at=r.classified_at,
            model_status="waste_model.h5 connected",
            classification_status="Completed",
        )
        for r in records
    ]


@router.get("/statistics", response_model=ClassificationSummary)
@router.get("/summary", response_model=ClassificationSummary)
def get_classification_summary(db: Session = Depends(get_db)):
    """GET /api/waste/statistics — returns aggregate counts & confidence stats."""
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    records = db.query(ClassificationHistory).filter(
        ClassificationHistory.classified_at >= today_start
    ).all()
    bio = [r for r in records if r.label == "BIO"]
    nonbio = [r for r in records if r.label == "NONBIO"]
    avg_conf = sum(r.confidence for r in records) / len(records) if records else 0.0
    return ClassificationSummary(
        total_today=len(records),
        bio_count=len(bio),
        nonbio_count=len(nonbio),
        avg_confidence=round(avg_conf, 4),
        hardware_sends_today=sum(1 for r in records if r.hardware_sent),
    )
