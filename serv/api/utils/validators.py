"""
FocusGuard API - Custom Validators

Validation functions for user input.
Raises ValidationException on failure.
"""

import re
from typing import Optional
from .exceptions import ValidationException


def validate_username(username: str) -> str:
    """
    Validate username format.
    
    Rules:
    - Length: 3-50 characters
    - Allowed: letters, numbers, underscore, hyphen
    - Must start with a letter or number
    - No consecutive special characters
    
    Args:
        username: Username to validate
        
    Returns:
        Validated username (stripped of whitespace)
        
    Raises:
        ValidationException: If username is invalid
    """
    username = username.strip()
    
    if not username:
        raise ValidationException("Username cannot be empty", field="username")
    
    if len(username) < 3:
        raise ValidationException(
            "Username must be at least 3 characters long",
            field="username",
            details={"min_length": 3}
        )
    
    if len(username) > 50:
        raise ValidationException(
            "Username must be at most 50 characters long",
            field="username",
            details={"max_length": 50}
        )
    
    # Must start with alphanumeric
    if not re.match(r'^[a-zA-Z0-9]', username):
        raise ValidationException(
            "Username must start with a letter or number",
            field="username"
        )
    
    # Only letters, numbers, underscore, hyphen allowed
    if not re.match(r'^[a-zA-Z0-9_-]+$', username):
        raise ValidationException(
            "Username can only contain letters, numbers, underscore, and hyphen",
            field="username"
        )
    
    # No consecutive special characters
    if re.search(r'[_-]{2,}', username):
        raise ValidationException(
            "Username cannot contain consecutive special characters",
            field="username"
        )
    
    return username


def validate_email(email: str) -> str:
    """
    Validate email format.
    
    Rules:
    - Basic RFC 5322 compliant format
    - Length: 5-255 characters
    - Must contain @ and domain
    
    Args:
        email: Email address to validate
        
    Returns:
        Validated email (lowercase, stripped)
        
    Raises:
        ValidationException: If email is invalid
    """
    email = email.strip().lower()
    
    if not email:
        raise ValidationException("Email cannot be empty", field="email")
    
    if len(email) < 5:
        raise ValidationException(
            "Email must be at least 5 characters long",
            field="email"
        )
    
    if len(email) > 255:
        raise ValidationException(
            "Email must be at most 255 characters long",
            field="email"
        )
    
    # Basic email regex (simplified RFC 5322)
    email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_regex, email):
        raise ValidationException(
            "Invalid email format",
            field="email"
        )
    
    return email


def validate_password_strength(password: str) -> str:
    """
    Validate password strength.
    
    Rules:
    - Minimum length: 8 characters
    - Maximum length: 128 characters
    - Must contain at least one letter
    - Must contain at least one number
    - Optional: Special characters recommended but not required
    
    Args:
        password: Password to validate
        
    Returns:
        Validated password (unchanged)
        
    Raises:
        ValidationException: If password is too weak
    """
    if not password:
        raise ValidationException("Password cannot be empty", field="password")
    
    if len(password) < 8:
        raise ValidationException(
            "Password must be at least 8 characters long",
            field="password",
            details={"min_length": 8}
        )
    
    if len(password) > 128:
        raise ValidationException(
            "Password must be at most 128 characters long",
            field="password",
            details={"max_length": 128}
        )
    
    # Must contain at least one letter
    if not re.search(r'[a-zA-Z]', password):
        raise ValidationException(
            "Password must contain at least one letter",
            field="password"
        )
    
    # Must contain at least one number
    if not re.search(r'[0-9]', password):
        raise ValidationException(
            "Password must contain at least one number",
            field="password"
        )
    
    return password


def validate_uuid(uuid_string: str, field_name: str = "id") -> str:
    """
    Validate UUID format.
    
    Args:
        uuid_string: UUID string to validate
        field_name: Name of the field for error messages
        
    Returns:
        Validated UUID string
        
    Raises:
        ValidationException: If UUID is invalid
    """
    uuid_regex = r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    
    if not re.match(uuid_regex, uuid_string.lower()):
        raise ValidationException(
            f"Invalid UUID format for {field_name}",
            field=field_name
        )
    
    return uuid_string.lower()
