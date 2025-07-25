from flask import Blueprint, request, jsonify
from .hf_client import classify_image
from .utils import decode_base64_image

api = Blueprint('api', __name__)

@api.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json(force=True)
        base64_img = data.get("image")
        if not base64_img:
            return jsonify({"error": "Missing image"}), 400

        image_bytes = decode_base64_image(base64_img)
        prediction = classify_image(image_bytes)

        return jsonify(prediction)

    except Exception as e:
        return jsonify({"error": str(e)}), 500
