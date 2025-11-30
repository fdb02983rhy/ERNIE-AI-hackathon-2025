from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from services.ernie_vl_service import extract_prescription

router = APIRouter(prefix="/api", tags=["api"])

DEMO_DIR = Path(__file__).parent.parent / "demo"


@router.post("/recognize")
def recognize():
    """Trigger OCR recognition on the current image using ERNIE VL."""
    image_path = DEMO_DIR / "scr.jpg"
    if not image_path.exists():
        raise HTTPException(status_code=404, detail="No image available")

    result = extract_prescription(str(image_path))
    return result


@router.get("/current")
def get_current_image():
    """Return the current captured image."""
    image_path = DEMO_DIR / "scr.jpg"
    if not image_path.exists():
        raise HTTPException(status_code=404, detail="No image available")
    return FileResponse(image_path, media_type="image/jpeg")
