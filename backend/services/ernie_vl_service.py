import base64
import json
from datetime import datetime, timedelta
from openai import OpenAI

ERNIE_API_KEY = "59545a2dbfe421301e2406bebff25d2654547b5a"
ERNIE_BASE_URL = "https://aistudio.baidu.com/llm/lmapi/v3"
ERNIE_MODEL = "ernie-4.5-vl-28b-a3b"

client = OpenAI(
    api_key=ERNIE_API_KEY,
    base_url=ERNIE_BASE_URL
)

MEDICINE_EXTRACTION_PROMPT = """You are a medical prescription analyzer. Analyze this prescription image and extract all medicine information.

Return ONLY a valid JSON object with the following structure:
{
  "medicines": [
    {
      "name": "medicine name (string)",
      "dose": "dosage amount as string (e.g., '500mg', '1錠')",
      "frequency_per_day": number of times to take per day as INTEGER,
      "duration_days": number of days to take as INTEGER,
      "timing": "when to take (e.g., 'morning', 'after meals', 'before bed', '食後', '朝')"
    }
  ]
}

IMPORTANT:
- frequency_per_day MUST be an integer (1, 2, 3, etc.)
- duration_days MUST be an integer (7, 14, 30, etc.)
- If "1日1回" = frequency_per_day: 1
- If "1日2回" = frequency_per_day: 2
- If "1日3回" = frequency_per_day: 3
- If "14日分" = duration_days: 14
- If "7日分" = duration_days: 7

Return ONLY valid JSON, no other text or explanation."""

# Default times for taking medicine based on frequency
TIMING_HOURS = {
    1: [8],           # Once: morning
    2: [8, 20],       # Twice: morning, evening
    3: [8, 14, 20],   # Three times: morning, afternoon, evening
    4: [8, 12, 18, 22]  # Four times
}


def extract_medicine_info(image_path: str) -> dict:
    """
    Extract medicine information from a prescription image using ERNIE VL.

    Args:
        image_path: Path to the prescription image

    Returns:
        Structured medicine information
    """
    # Read and encode image
    with open(image_path, "rb") as f:
        image_data = base64.b64encode(f.read()).decode("utf-8")

    # Determine image type
    if image_path.lower().endswith(".png"):
        mime_type = "image/png"
    elif image_path.lower().endswith(".gif"):
        mime_type = "image/gif"
    else:
        mime_type = "image/jpeg"

    try:
        response = client.chat.completions.create(
            model=ERNIE_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{mime_type};base64,{image_data}"
                            }
                        },
                        {
                            "type": "text",
                            "text": MEDICINE_EXTRACTION_PROMPT
                        }
                    ]
                }
            ],
            max_tokens=2048
        )

        result_text = response.choices[0].message.content

        # Try to parse as JSON
        try:
            # Clean up the response if it has markdown code blocks
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0]
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0]

            medicine_data = json.loads(result_text.strip())
            return {
                "success": True,
                "data": medicine_data
            }
        except json.JSONDecodeError:
            return {
                "success": True,
                "data": None,
                "raw_response": result_text
            }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def generate_takings(medicines: list) -> list:
    """
    Generate takings list from extracted medicine information.

    Args:
        medicines: List of medicine dicts with name, dose, frequency_per_day, duration_days, timing

    Returns:
        List of takings in the format expected by frontend
    """
    takings = []
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

    for med in medicines:
        name = med.get("name", "Unknown")
        dose = med.get("dose", "")
        frequency = med.get("frequency_per_day", 1)
        duration = med.get("duration_days", 7)
        timing = med.get("timing", "")

        # Get hours for this frequency
        hours = TIMING_HOURS.get(frequency, TIMING_HOURS[1])

        # Generate takings for each day and each time
        for day in range(duration):
            current_date = today + timedelta(days=day)
            for hour in hours:
                taking_time = current_date.replace(hour=hour, minute=0)
                takings.append({
                    "name": f"{name} {dose}, day {day + 1}/{duration}",
                    "start": taking_time.isoformat(),
                    "description": timing if timing else f"Take {dose}"
                })

    return takings


def extract_prescription(image_path: str) -> dict:
    """
    Extract prescription info and return takings for frontend.

    Args:
        image_path: Path to the prescription image

    Returns:
        Dict with takings list
    """
    result = extract_medicine_info(image_path)

    if not result.get("success") or not result.get("data"):
        return {"takings": [], "error": result.get("error", "Failed to extract medicine info")}

    medicines = result["data"].get("medicines", [])
    takings = generate_takings(medicines)

    return {"takings": takings}
