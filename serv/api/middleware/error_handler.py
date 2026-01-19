"""
FocusGuard API - Error Handler Middleware

Global error handling for consistent error responses.
Catches exceptions and formats them into standardized JSON responses.
"""

from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime, timezone
import traceback

from ..utils.exceptions import APIException
from ..config import settings


async def api_exception_handler(request: Request, exc: APIException) -> JSONResponse:
    """
    Handle custom APIException errors.
    
    Returns standardized error response with proper status code.
    """
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": {
                "message": exc.message,
                "error_code": exc.error_code,
                "status_code": exc.status_code,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                **({"details": exc.details} if exc.details else {})
            }
        }
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """
    Handle Pydantic validation errors.
    
    Formats validation errors into readable messages.
    """
    errors = []
    for error in exc.errors():
        errors.append({
            "field": ".".join(str(x) for x in error["loc"][1:]),  # Skip 'body'
            "message": error["msg"],
            "type": error["type"]
        })
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": {
                "message": "Validation error",
                "error_code": "VALIDATION_ERROR",
                "status_code": 422,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "errors": errors
            }
        }
    )


async def database_exception_handler(request: Request, exc: SQLAlchemyError) -> JSONResponse:
    """
    Handle SQLAlchemy database errors.
    
    Logs the error and returns a generic message to the client.
    """
    # Log the full error for debugging
    if settings.debug:
        print(f"Database error: {exc}")
        traceback.print_exc()
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": {
                "message": "Database error occurred",
                "error_code": "DATABASE_ERROR",
                "status_code": 500,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                **({"db_error": str(exc)} if settings.debug else {})
            }
        }
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Handle all other uncaught exceptions.
    
    Last resort error handler for unexpected errors.
    """
    # Log the full error
    if settings.debug:
        print(f"Unexpected error: {exc}")
        traceback.print_exc()
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": {
                "message": "Internal server error",
                "error_code": "INTERNAL_SERVER_ERROR",
                "status_code": 500,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                **({"error": str(exc)} if settings.debug else {})
            }
        }
    )


def register_exception_handlers(app):
    """
    Register all exception handlers with the FastAPI app.
    
    Usage:
        from api.middleware.error_handler import register_exception_handlers
        register_exception_handlers(app)
    """
    # Custom API exceptions
    app.add_exception_handler(APIException, api_exception_handler)
    
    # Pydantic validation errors
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    
    # Database errors
    app.add_exception_handler(SQLAlchemyError, database_exception_handler)
    
    # Generic catch-all
    app.add_exception_handler(Exception, generic_exception_handler)
