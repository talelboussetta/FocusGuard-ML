import os
from dotenv import load_dotenv

load_dotenv()
HF_API_KEY = os.getenv("HF_API_KEY")

MODEL_ENDPOINT = "https://api-inference.huggingface.co/models/HardlyHumans/Facial-expression-detection"

def classify_image(image_bytes):
    headers = {
        "Authorization": f"Bearer {HF_API_KEY}",
        "Content-Type": "application/octet-stream"
    }

    response = requests.post(MODEL_ENDPOINT, headers=headers, data=image_bytes)

    if response.status_code != 200:
        raise Exception(f"HuggingFace API error {response.status_code}: {response.text}")

    return response.json()
