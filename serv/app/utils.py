import base64
from io import BytesIO

def decode_base64_image(base64_string):
    base64_data = base64_string.split(',')[1] if ',' in base64_string else base64_string
    return base64.b64decode(base64_data)
