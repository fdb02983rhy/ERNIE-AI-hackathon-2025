from pathlib import Path

import httpx
from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import FileResponse, Response, StreamingResponse

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


@router.get("/stream-proxy")
async def stream_proxy(url: str):
    """Proxy requests to external stream URLs to bypass CORS."""
    try:
        client = httpx.AsyncClient(timeout=None)
        req = client.build_request("GET", url)
        response = await client.send(req, stream=True)

        async def stream_generator():
            try:
                async for chunk in response.aiter_bytes(chunk_size=4096):
                    yield chunk
            finally:
                await response.aclose()
                await client.aclose()

        return StreamingResponse(
            stream_generator(),
            media_type=response.headers.get("content-type", "multipart/x-mixed-replace"),
        )
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch stream: {str(e)}")


@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    """Upload an image file to the demo directory."""
    DEMO_DIR.mkdir(parents=True, exist_ok=True)
    image_path = DEMO_DIR / "scr.jpg"
    content = await file.read()
    image_path.write_bytes(content)
    return {"status": "ok", "path": str(image_path)}
