import requests
from config import HF_API_TOKEN, HF_MODEL_ENDPOINT

def classify_image(image_bytes):
    headers = {"Authorization": f"Bearer {HF_API_TOKEN}"}
    response = requests.post(HF_MODEL_ENDPOINT, headers=headers, data=image_bytes)
    return response.json()
