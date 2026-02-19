"""
FocusGuard API - CORS Middleware

Cross-Origin Resource Sharing configuration.
Allows the React frontend to communicate with the API.
"""

from fastapi.middleware.cors import CORSMiddleware
from ..config import settings


def add_cors_middleware(app):
    """
    Add CORS middleware to the FastAPI app.
    
    Configures allowed origins, methods, and headers based on settings.
    
    Usage:
        from api.middleware.cors_middleware import add_cors_middleware
        add_cors_middleware(app)
    """
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,  # Frontend URLs
        allow_credentials=settings.allow_credentials,  # Allow cookies
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],  # HTTP methods
        allow_headers=[
            "Authorization",
            "Content-Type",
            "Accept",
            "Origin",
            "User-Agent",
            "DNT",
            "Cache-Control",
            "X-Requested-With",
        ],
        expose_headers=["Content-Length", "X-Total-Count"],  # Headers frontend can read
        max_age=600,  # Cache preflight requests for 10 minutes
    )


# Alternative: Manual CORS configuration for more control
def get_cors_config():
    """
    Get CORS configuration dictionary.
    
    Returns configuration that can be passed to CORSMiddleware.
    """
    return {
        "allow_origins": settings.allowed_origins,
        "allow_credentials": settings.allow_credentials,
        "allow_methods": ["*"],  # Allow all methods
        "allow_headers": ["*"],  # Allow all headers
    }
