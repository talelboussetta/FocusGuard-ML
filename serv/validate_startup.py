#!/usr/bin/env python3
"""
Startup Validation Script for Render Deployment

Run this before the main app to diagnose issues.
"""

import os
import sys


def validate_environment():
    """Validate critical environment variables."""
    print("="*60)
    print("FocusGuard Startup Validation")
    print("="*60)
    
    issues = []
    warnings = []
    
    # Check DATABASE_URL
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        issues.append("❌ DATABASE_URL not set")
    elif "postgresql" not in db_url:
        issues.append("❌ DATABASE_URL doesn't contain 'postgresql'")
    else:
        # Ensure it uses asyncpg
        if "postgresql+asyncpg" not in db_url:
            print(f"⚠️  Converting DATABASE_URL to use asyncpg driver...")
            db_url = db_url.replace("postgresql://", "postgresql+asyncpg://")
            os.environ["DATABASE_URL"] = db_url
            print(f"✅ DATABASE_URL updated: {db_url[:50]}...")
        else:
            print(f"✅ DATABASE_URL: {db_url[:50]}...")
    
    # Check PORT
    port = os.getenv("PORT", "8000")
    print(f"✅ PORT: {port}")
    
    # Check JWT_SECRET_KEY
    jwt_secret = os.getenv("JWT_SECRET_KEY")
    if not jwt_secret:
        warnings.append("⚠️  JWT_SECRET_KEY not set (using default - INSECURE)")
    elif "your-super-secret-key" in jwt_secret:
        warnings.append("⚠️  JWT_SECRET_KEY is default value - INSECURE for production")
    else:
        print(f"✅ JWT_SECRET_KEY: {jwt_secret[:10]}...")
    
    # Check ALLOWED_ORIGINS
    origins = os.getenv("ALLOWED_ORIGINS", "")
    if not origins:
        warnings.append("⚠️  ALLOWED_ORIGINS not set")
    else:
        print(f"✅ ALLOWED_ORIGINS: {origins}")
    
    # Check Supabase (optional but recommended)
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    if not supabase_url or not supabase_key:
        warnings.append("⚠️  SUPABASE_URL or SUPABASE_KEY not set (AI Tutor will fail)")
    else:
        print(f"✅ SUPABASE_URL: {supabase_url}")
    
    # Check HuggingFace API Key
    hf_key = os.getenv("HUGGINGFACE_API_KEY")
    if not hf_key:
        warnings.append("⚠️  HUGGINGFACE_API_KEY not set (AI responses will fail)")
    else:
        print(f"✅ HUGGINGFACE_API_KEY: {hf_key[:10]}...")
    
    print("="*60)
    
    # Print warnings
    if warnings:
        print("\n⚠️  WARNINGS:")
        for warning in warnings:
            print(f"  {warning}")
    
    # Print issues
    if issues:
        print("\n❌ CRITICAL ISSUES:")
        for issue in issues:
            print(f"  {issue}")
        print("\n💡 Fix these issues before deploying!")
        return False
    
    if not warnings:
        print("\n✅ All checks passed! Ready to start.")
    
    return True


def check_imports():
    """Verify critical dependencies are installed."""
    print("\n" + "="*60)
    print("Checking Python Dependencies")
    print("="*60)
    
    required_packages = [
        "fastapi",
        "uvicorn",
        "sqlalchemy",
        "asyncpg",
        "pydantic",
        "jose",
        "passlib",
        "slowapi",
        "supabase",
        "vecs",
        "sentence_transformers",
    ]
    
    missing = []
    for package in required_packages:
        try:
            __import__(package)
            print(f"✅ {package}")
        except ImportError:
            print(f"❌ {package} - NOT INSTALLED")
            missing.append(package)
    
    if missing:
        print(f"\n❌ Missing packages: {', '.join(missing)}")
        print("💡 Run: pip install -r requirements.txt")
        return False
    
    print("\n✅ All dependencies installed")
    return True


if __name__ == "__main__":
    print("\n🚀 FocusGuard Deployment Validation\n")
    
    env_ok = validate_environment()
    deps_ok = check_imports()
    
    if env_ok and deps_ok:
        print("\n" + "="*60)
        print("✅ VALIDATION PASSED - Starting application...")
        print("="*60 + "\n")
        sys.exit(0)
    else:
        print("\n" + "="*60)
        print("❌ VALIDATION FAILED - Fix issues above")
        print("="*60 + "\n")
        sys.exit(1)
