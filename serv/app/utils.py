# app/utils.py

import base64
import io

def decode_base64_image(base64_string):
    if "," in base64_string:
        base64_string = base64_string.split(",")[1]  # Remove header like "data:image/jpeg;base64,"

    image_data = base64.b64decode(base64_string)
    return io.BytesIO(image_data)
