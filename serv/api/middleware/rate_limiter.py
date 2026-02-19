"""
FocusGuard API - Rate Limiter Middleware

Request rate limiting to prevent abuse.
Limits requests per IP address or user.
"""

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request

from ..config import settings


def get_remote_address_skip_options(request: Request) -> str:
    """
    Get remote address for rate limiting, but skip OPTIONS requests.
    
    OPTIONS requests are CORS preflight and should not be rate limited.
    """
    if request.method == "OPTIONS":
        # Return empty string to skip rate limiting for OPTIONS
        return ""
    return get_remote_address(request)


# Create rate limiter instance
limiter = Limiter(
    key_func=get_remote_address_skip_options,  # Rate limit by IP address, skip OPTIONS
    default_limits=[f"{settings.rate_limit_per_minute}/minute"],  # Default: 60 req/min
    enabled=settings.rate_limit_enabled,  # Can be disabled via config
)


def get_rate_limiter():
    """
    Get the rate limiter instance.
    
    Usage:
        from api.middleware.rate_limiter import limiter
        
        @router.post("/endpoint")
        @limiter.limit("5/minute")
        async def limited_endpoint(request: Request):
            pass
    """
    return limiter


def add_rate_limiting(app):
    """
    Add rate limiting to the FastAPI app.
    
    Usage:
        from api.middleware.rate_limiter import add_rate_limiting
        add_rate_limiting(app)
    """
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# Custom rate limit decorators for specific use cases

def strict_rate_limit(limit: str):
    """
    Apply strict rate limit to a route.
    
    Usage:
        @router.post("/login")
        @limiter.limit("5/minute")  # Max 5 login attempts per minute
        async def login(request: Request, ...):
            pass
    """
    return limiter.limit(limit)


# Common rate limit patterns
LOGIN_RATE_LIMIT = f"{settings.login_rate_limit_per_minute}/minute"  # 5/minute
REGISTER_RATE_LIMIT = "3/minute"  # 3 registrations per minute
API_RATE_LIMIT = f"{settings.rate_limit_per_minute}/minute"  # 60/minute


# Example: Custom key function for user-based rate limiting
def get_user_id_from_token(request: Request) -> str:
    """
    Extract user ID from JWT token for user-based rate limiting.
    
    Falls back to IP address if no token present.
    """
    try:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            # Would extract user ID from token
            # For now, fall back to IP
            return get_remote_address(request)
        return get_remote_address(request)
    except:
        return get_remote_address(request)


# User-based rate limiter (for authenticated routes)
user_limiter = Limiter(
    key_func=get_user_id_from_token,
    default_limits=[f"{settings.rate_limit_per_minute}/minute"],
    enabled=settings.rate_limit_enabled,
)
