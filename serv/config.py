import os
from dotenv import load_dotenv

load_dotenv()  # load .env file variables into os.environ

HF_API_TOKEN = os.getenv("HF_API_TOKEN")
HF_MODEL_ENDPOINT = os.getenv("HF_MODEL_ENDPOINT", "https://api-inference.huggingface.co/models/HardlyHumans/Facial-expression-detection")
