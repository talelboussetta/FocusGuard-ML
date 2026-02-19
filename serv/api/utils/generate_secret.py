"""
FocusGuard API - JWT Secret Key Generator

Utility script to generate a secure random secret key for JWT signing.
Run this script to generate a new JWT_SECRET_KEY for your .env file.

Usage:
    python -m api.utils.generate_secret
    
Or from serv directory:
    python api/utils/generate_secret.py
"""

import secrets


def generate_secret_key(length: int = 32) -> str:
    """
    Generate a cryptographically secure random secret key.
    
    Args:
        length: Length of the secret in bytes (default: 32)
        
    Returns:
        Hexadecimal string of random bytes
    """
    return secrets.token_hex(length)


def main():
    """Generate and display a new JWT secret key."""
    print("\n" + "="*70)
    print("FocusGuard API - JWT Secret Key Generator")
    print("="*70)
    
    # Generate a 32-byte (256-bit) secret key
    secret_key = generate_secret_key(32)
    
    print(f"\nGenerated JWT Secret Key (copy this to your .env file):\n")
    print(f"JWT_SECRET_KEY={secret_key}")
    print("\n" + "="*70)
    print("⚠️  Keep this secret! Never commit it to version control.")
    print("="*70 + "\n")
    
    return secret_key


if __name__ == "__main__":
    main()
