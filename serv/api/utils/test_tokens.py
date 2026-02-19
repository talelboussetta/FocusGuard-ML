"""
FocusGuard API - Token Testing Utility

Test script for creating and verifying JWT tokens.
Useful for debugging and understanding how tokens work.

Usage:
    python -m api.utils.test_tokens
"""

from datetime import timedelta
from .jwt_handler import create_access_token, create_refresh_token, verify_token, decode_token
from .exceptions import TokenExpiredException, InvalidTokenException


def test_token_creation():
    """Test creating and verifying tokens."""
    print("\n" + "="*70)
    print("JWT Token Testing")
    print("="*70)
    
    # Test data
    user_data = {
        "sub": "a1111111-1111-1111-1111-111111111111",
        "username": "test_user"
    }
    
    # Create access token
    print("\n1. Creating Access Token...")
    access_token = create_access_token(user_data)
    print(f"   Token: {access_token[:50]}...")
    
    # Create refresh token
    print("\n2. Creating Refresh Token...")
    refresh_token = create_refresh_token(user_data)
    print(f"   Token: {refresh_token[:50]}...")
    
    # Decode access token
    print("\n3. Decoding Access Token...")
    try:
        payload = decode_token(access_token)
        print(f"   User ID: {payload.get('sub')}")
        print(f"   Username: {payload.get('username')}")
        print(f"   Type: {payload.get('type')}")
        print(f"   Expires: {payload.get('exp')}")
    except (TokenExpiredException, InvalidTokenException) as e:
        print(f"   Error: {e}")
    
    # Verify access token
    print("\n4. Verifying Access Token...")
    try:
        verified_payload = verify_token(access_token, expected_type="access")
        print(f"   ✓ Token is valid")
        print(f"   ✓ User: {verified_payload.get('username')}")
    except (TokenExpiredException, InvalidTokenException) as e:
        print(f"   ✗ Verification failed: {e}")
    
    # Verify refresh token
    print("\n5. Verifying Refresh Token...")
    try:
        verified_payload = verify_token(refresh_token, expected_type="refresh")
        print(f"   ✓ Token is valid")
        print(f"   ✓ Type: {verified_payload.get('type')}")
    except (TokenExpiredException, InvalidTokenException) as e:
        print(f"   ✗ Verification failed: {e}")
    
    # Test with wrong type
    print("\n6. Testing Type Mismatch (should fail)...")
    try:
        verify_token(access_token, expected_type="refresh")
        print(f"   ✗ Should have failed!")
    except InvalidTokenException as e:
        print(f"   ✓ Correctly rejected: {e.message}")
    
    # Test expired token
    print("\n7. Testing Expired Token...")
    expired_token = create_access_token(user_data, expires_delta=timedelta(seconds=-1))
    try:
        decode_token(expired_token)
        print(f"   ✗ Should have failed!")
    except TokenExpiredException as e:
        print(f"   ✓ Correctly rejected: {e.message}")
    
    print("\n" + "="*70)
    print("✓ Token testing complete!")
    print("="*70 + "\n")


if __name__ == "__main__":
    test_token_creation()
