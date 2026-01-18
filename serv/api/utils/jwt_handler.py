"""
FocusGuard API - JWT Handler Utility

Functions for JWT token operations using python-jose.
Handles access tokens (short-lived) and refresh tokens (long-lived).
"""

from datetime import datetime, timedelta
from typing import Dict, Optional
from jose import jwt, JWTError
from .exceptions import TokenExpiredException, InvalidTokenException


# These will be overridden by config in production
DEFAULT_SECRET_KEY = "your-super-secret-key-change-in-production"
DEFAULT_ALGORITHM = "HS256"
DEFAULT_ACCESS_TOKEN_EXPIRE_MINUTES = 15
DEFAULT_REFRESH_TOKEN_EXPIRE_DAYS = 7


def create_access_token(
    data: Dict[str, any],
    secret_key: str = DEFAULT_SECRET_KEY,
    algorithm: str = DEFAULT_ALGORITHM,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: Payload data to encode (usually {"sub": user_id, "username": username})
        secret_key: Secret key for signing the token
        algorithm: JWT algorithm (default: HS256)
        expires_delta: Token expiration time (default: 15 minutes)
        
    Returns:
        Encoded JWT token string
        
    Example:
        >>> token = create_access_token({"sub": "user-uuid", "username": "alice"})
        >>> isinstance(token, str)
        True
    """
    to_encode = data.copy()
    
    # Set expiration time
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=DEFAULT_ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Add standard JWT claims
    to_encode.update({
        "exp": expire,  # Expiration time
        "iat": datetime.utcnow(),  # Issued at time
        "type": "access"  # Token type
    })
    
    encoded_jwt = jwt.encode(to_encode, secret_key, algorithm=algorithm)
    return encoded_jwt


def create_refresh_token(
    data: Dict[str, any],
    secret_key: str = DEFAULT_SECRET_KEY,
    algorithm: str = DEFAULT_ALGORITHM,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT refresh token (longer expiration).
    
    Args:
        data: Payload data to encode
        secret_key: Secret key for signing the token
        algorithm: JWT algorithm (default: HS256)
        expires_delta: Token expiration time (default: 7 days)
        
    Returns:
        Encoded JWT refresh token string
    """
    to_encode = data.copy()
    
    # Set expiration time (longer for refresh tokens)
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=DEFAULT_REFRESH_TOKEN_EXPIRE_DAYS)
    
    # Add standard JWT claims
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "refresh"  # Mark as refresh token
    })
    
    encoded_jwt = jwt.encode(to_encode, secret_key, algorithm=algorithm)
    return encoded_jwt


def decode_token(
    token: str,
    secret_key: str = DEFAULT_SECRET_KEY,
    algorithm: str = DEFAULT_ALGORITHM,
    verify_expiration: bool = True
) -> Dict[str, any]:
    """
    Decode and verify a JWT token.
    
    Args:
        token: JWT token string to decode
        secret_key: Secret key used to sign the token
        algorithm: JWT algorithm (default: HS256)
        verify_expiration: Whether to verify token expiration (default: True)
        
    Returns:
        Decoded token payload as dictionary
        
    Raises:
        TokenExpiredException: If token has expired
        InvalidTokenException: If token is invalid or malformed
        
    Example:
        >>> token = create_access_token({"sub": "user-123"})
        >>> payload = decode_token(token)
        >>> payload["sub"]
        'user-123'
    """
    try:
        # Decode and verify token
        payload = jwt.decode(
            token,
            secret_key,
            algorithms=[algorithm],
            options={"verify_exp": verify_expiration}
        )
        return payload
        
    except jwt.ExpiredSignatureError:
        raise TokenExpiredException("Token has expired")
        
    except JWTError as e:
        raise InvalidTokenException(f"Invalid token: {str(e)}")


def verify_token(
    token: str,
    secret_key: str = DEFAULT_SECRET_KEY,
    algorithm: str = DEFAULT_ALGORITHM,
    expected_type: Optional[str] = None
) -> Dict[str, any]:
    """
    Verify a JWT token and optionally check its type.
    
    Args:
        token: JWT token string to verify
        secret_key: Secret key used to sign the token
        algorithm: JWT algorithm (default: HS256)
        expected_type: Expected token type ("access" or "refresh")
        
    Returns:
        Decoded token payload
        
    Raises:
        TokenExpiredException: If token has expired
        InvalidTokenException: If token is invalid or wrong type
    """
    payload = decode_token(token, secret_key, algorithm)
    
    # Verify token type if specified
    if expected_type:
        token_type = payload.get("type")
        if token_type != expected_type:
            raise InvalidTokenException(
                f"Expected {expected_type} token, got {token_type}"
            )
    
    return payload


def get_token_subject(token: str, secret_key: str = DEFAULT_SECRET_KEY) -> Optional[str]:
    """
    Extract the subject (user ID) from a token without full validation.
    Useful for quick checks.
    
    Args:
        token: JWT token string
        secret_key: Secret key used to sign the token
        
    Returns:
        Subject (user ID) or None if invalid
    """
    try:
        payload = decode_token(token, secret_key, verify_expiration=False)
        return payload.get("sub")
    except (TokenExpiredException, InvalidTokenException):
        return None
