"""
FocusGuard API - Password Utility

Functions for password operations:
- hash_password() - Bcrypt hashing with cost factor 12
- verify_password() - Password verification against hash
"""

from passlib.context import CryptContext

# Bcrypt context with cost factor 12 (2^12 iterations)
# Higher cost = more secure but slower (12 is good balance)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """
    Hash a plain text password using bcrypt.
    
    Args:
        password: Plain text password to hash
        
    Returns:
        Hashed password string (bcrypt format)
        
    Example:
        >>> hashed = hash_password("mySecurePassword123")
        >>> hashed.startswith("$2b$")
        True
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain text password against a bcrypt hash.
    
    Args:
        plain_password: Plain text password to verify
        hashed_password: Bcrypt hashed password from database
        
    Returns:
        True if password matches, False otherwise
        
    Example:
        >>> hashed = hash_password("myPassword")
        >>> verify_password("myPassword", hashed)
        True
        >>> verify_password("wrongPassword", hashed)
        False
    """
    return pwd_context.verify(plain_password, hashed_password)
