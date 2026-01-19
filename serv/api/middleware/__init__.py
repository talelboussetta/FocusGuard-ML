"""
FocusGuard API Middleware Package

Exports middleware setup functions and dependencies.
"""

from .error_handler import register_exception_handlers
from .cors_middleware import add_cors_middleware
from .rate_limiter import add_rate_limiting, limiter, LOGIN_RATE_LIMIT, REGISTER_RATE_LIMIT
from .auth_middleware import (
    get_current_user_id,
    get_current_user_payload,
    optional_authentication,
    security
)

__all__ = [
    # Setup functions
    "register_exception_handlers",
    "add_cors_middleware",
    "add_rate_limiting",
    
    # Rate limiter
    "limiter",
    "LOGIN_RATE_LIMIT",
    "REGISTER_RATE_LIMIT",
    
    # Auth dependencies
    "get_current_user_id",
    "get_current_user_payload",
    "optional_authentication",
    "security",
]
