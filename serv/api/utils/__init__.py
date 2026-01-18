"""
FocusGuard API Utilities Package

Exports commonly used utility functions.
"""

from .password import hash_password, verify_password
from .jwt_handler import (
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_token,
    get_token_subject
)
from .validators import (
    validate_username,
    validate_email,
    validate_password_strength,
    validate_uuid
)
from .exceptions import (
    APIException,
    InvalidCredentialsException,
    TokenExpiredException,
    InvalidTokenException,
    UnauthorizedException,
    UserNotFoundException,
    DuplicateUserException,
    SessionNotFoundException,
    ActiveSessionExistsException,
    GardenNotFoundException,
    ForbiddenException,
    ValidationException
)

__all__ = [
    # Password utilities
    "hash_password",
    "verify_password",
    
    # JWT utilities
    "create_access_token",
    "create_refresh_token",
    "decode_token",
    "verify_token",
    "get_token_subject",
    
    # Validators
    "validate_username",
    "validate_email",
    "validate_password_strength",
    "validate_uuid",
    
    # Exceptions
    "APIException",
    "InvalidCredentialsException",
    "TokenExpiredException",
    "InvalidTokenException",
    "UnauthorizedException",
    "UserNotFoundException",
    "DuplicateUserException",
    "SessionNotFoundException",
    "ActiveSessionExistsException",
    "GardenNotFoundException",
    "ForbiddenException",
    "ValidationException",
]
