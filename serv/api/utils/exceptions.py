"""
FocusGuard API - Custom Exceptions

Application-specific exceptions for better error handling.
All custom exceptions inherit from base APIException.
"""

from typing import Any, Optional


class APIException(Exception):
    """Base exception for all API errors."""
    
    def __init__(
        self,
        message: str,
        status_code: int = 500,
        error_code: Optional[str] = None,
        details: Optional[Any] = None
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code or self.__class__.__name__.replace("Exception", "").upper()
        self.details = details
        super().__init__(self.message)


# ============================================================================
# Authentication Exceptions
# ============================================================================

class InvalidCredentialsException(APIException):
    """Raised when login credentials are invalid."""
    
    def __init__(self, message: str = "Invalid username or password"):
        super().__init__(
            message=message,
            status_code=401,
            error_code="INVALID_CREDENTIALS"
        )


class TokenExpiredException(APIException):
    """Raised when JWT token has expired."""
    
    def __init__(self, message: str = "Token has expired"):
        super().__init__(
            message=message,
            status_code=401,
            error_code="TOKEN_EXPIRED"
        )


class InvalidTokenException(APIException):
    """Raised when JWT token is invalid or malformed."""
    
    def __init__(self, message: str = "Invalid or malformed token"):
        super().__init__(
            message=message,
            status_code=401,
            error_code="INVALID_TOKEN"
        )


class UnauthorizedException(APIException):
    """Raised when user is not authenticated."""
    
    def __init__(self, message: str = "Authentication required"):
        super().__init__(
            message=message,
            status_code=401,
            error_code="UNAUTHORIZED"
        )


# ============================================================================
# User Exceptions
# ============================================================================

class UserNotFoundException(APIException):
    """Raised when user is not found in database."""
    
    def __init__(self, message: str = "User not found", user_id: Optional[str] = None):
        super().__init__(
            message=message,
            status_code=404,
            error_code="USER_NOT_FOUND",
            details={"user_id": user_id} if user_id else None
        )


class DuplicateUserException(APIException):
    """Raised when trying to create user with existing username/email."""
    
    def __init__(self, field: str = "username", value: Optional[str] = None):
        message = f"User with this {field} already exists"
        super().__init__(
            message=message,
            status_code=409,
            error_code="DUPLICATE_USER",
            details={"field": field, "value": value}
        )


# ============================================================================
# Session Exceptions
# ============================================================================

class SessionNotFoundException(APIException):
    """Raised when session is not found."""
    
    def __init__(self, message: str = "Session not found", session_id: Optional[str] = None):
        super().__init__(
            message=message,
            status_code=404,
            error_code="SESSION_NOT_FOUND",
            details={"session_id": session_id} if session_id else None
        )


class ActiveSessionExistsException(APIException):
    """Raised when trying to create session while one is active."""
    
    def __init__(self, message: str = "An active session already exists"):
        super().__init__(
            message=message,
            status_code=409,
            error_code="ACTIVE_SESSION_EXISTS"
        )


# ============================================================================
# Garden Exceptions
# ============================================================================

class GardenNotFoundException(APIException):
    """Raised when garden entry is not found."""
    
    def __init__(self, message: str = "Garden entry not found", garden_id: Optional[str] = None):
        super().__init__(
            message=message,
            status_code=404,
            error_code="GARDEN_NOT_FOUND",
            details={"garden_id": garden_id} if garden_id else None
        )


# ============================================================================
# Permission Exceptions
# ============================================================================

class ForbiddenException(APIException):
    """Raised when user doesn't have permission to access resource."""
    
    def __init__(self, message: str = "You don't have permission to access this resource"):
        super().__init__(
            message=message,
            status_code=403,
            error_code="FORBIDDEN"
        )


# ============================================================================
# Validation Exceptions
# ============================================================================

class ValidationException(APIException):
    """Raised when input validation fails."""
    
    def __init__(self, message: str, field: Optional[str] = None, details: Optional[Any] = None):
        super().__init__(
            message=message,
            status_code=422,
            error_code="VALIDATION_ERROR",
            details={"field": field, **(details or {})} if field else details
        )
