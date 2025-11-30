from datetime import datetime


def recognize_prescription(image_path: str) -> dict:
    """
    Process an image with OCR and extract prescription information.

    For now returns dummy data. Will be replaced with actual PaddleOCR implementation.
    """
    # TODO: Implement actual OCR processing with PaddleOCR

    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

    return {
        "takings": [
            {
                "name": "Amoxicillin 500mg, day 1/3",
                "start": today.replace(hour=10, minute=0).isoformat(),
                "description": "Take 1 capsule with food"
            },
            {
                "name": "Ibuprofen 400mg, day 1/3",
                "start": today.replace(hour=16, minute=0).isoformat(),
                "description": "Take 1 tablet as needed for pain"
            },
            {
                "name": "Vitamin D 1000IU, day 1/3",
                "start": today.replace(hour=19, minute=0).isoformat(),
                "description": "Take 1 tablet with dinner"
            }
        ]
    }
