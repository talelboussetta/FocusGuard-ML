# app/__init__.py

from flask import Flask
from .routes import api
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    CORS(app)
    app.register_blueprint(api)
    return app
