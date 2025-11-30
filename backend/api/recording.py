from fastapi import APIRouter

router = APIRouter(prefix="/recording", tags=["recording"])


@router.post("/take")
def take_recording():
    return {"status": "recording taken"}
