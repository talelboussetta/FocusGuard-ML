"""
FocusGuard API - Configuration Management

Loads environment variables and provides application configuration.
Uses pydantic-settings for type-safe configuration management.
"""

from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator as validator


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    
    Environment variables can be set in:
    - System environment
    - .env file in the project root
    - Docker environment
    """
    
    # ========================================================================
    # Application Settings
    # ========================================================================
    
    app_name: str = Field(default="FocusGuard API", description="Application name")
    app_version: str = Field(default="0.1.0", description="API version")
    debug: bool = Field(default=False, description="Debug mode")
    host: str = Field(default="0.0.0.0", description="Server host")
    port: int = Field(default=8000, description="Server port")
    
    # ========================================================================
    # Database Settings
    # ========================================================================
    
    database_url: str = Field(
        default="postgresql+asyncpg://user:password@localhost:5432/focusguard_db",
        description="Async PostgreSQL database URL"
    )
    
    database_echo: bool = Field(
        default=False,
        description="Echo SQL queries (set True for debugging)"
    )
    
    # ========================================================================
    # JWT Settings
    # ========================================================================
    
    jwt_secret_key: str = Field(
        default="your-super-secret-key-change-in-production-use-openssl-rand-hex-32",
        description="Secret key for JWT signing"
    )
    
    jwt_algorithm: str = Field(
        default="HS256",
        description="JWT signing algorithm"
    )
    
    access_token_expire_minutes: int = Field(
        default=15,
        description="Access token expiration in minutes"
    )
    
    refresh_token_expire_days: int = Field(
        default=7,
        description="Refresh token expiration in days"
    )
    
    # ========================================================================
    # CORS Settings
    # ========================================================================
    
    allowed_origins: List[str] = Field(
        default=[
            "http://localhost:5173",  # Vite dev server
            "http://localhost:3000",  # React dev server
            "http://127.0.0.1:5173",
            "http://127.0.0.1:3000",
        ],
        description="Allowed CORS origins"
    )
    
    allow_credentials: bool = Field(
        default=True,
        description="Allow credentials in CORS"
    )
    
    # ========================================================================
    # Security Settings
    # ========================================================================
    
    bcrypt_rounds: int = Field(
        default=12,
        description="Bcrypt cost factor (higher = more secure but slower)"
    )
    
    # ========================================================================
    # Rate Limiting Settings
    # ========================================================================
    
    rate_limit_enabled: bool = Field(
        default=True,
        description="Enable rate limiting"
    )
    
    rate_limit_per_minute: int = Field(
        default=60,
        description="Maximum requests per minute per IP"
    )
    
    login_rate_limit_per_minute: int = Field(
        default=5,
        description="Maximum login attempts per minute"
    )
    
    # ========================================================================
    # Pydantic Settings Configuration
    # ========================================================================
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    @validator("allowed_origins", pre=True)
    def parse_cors_origins(cls, v):
        """Parse CORS origins from comma-separated string or list."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v


# ============================================================================
# Global Settings Instance
# ============================================================================

settings = Settings()


# ============================================================================
# Configuration Display (for debugging)
# ============================================================================

def display_settings() -> None:
    """Print current settings (masks sensitive values)."""
    print("\n" + "="*60)
    print("FocusGuard API Configuration")
    print("="*60)
    print(f"App Name:        {settings.app_name}")
    print(f"Version:         {settings.app_version}")
    print(f"Debug Mode:      {settings.debug}")
    print(f"Host:            {settings.host}")
    print(f"Port:            {settings.port}")
    print(f"Database:        {settings.database_url.split('@')[1] if '@' in settings.database_url else 'configured'}")
    print(f"JWT Algorithm:   {settings.jwt_algorithm}")
    print(f"Access Token:    {settings.access_token_expire_minutes} minutes")
    print(f"Refresh Token:   {settings.refresh_token_expire_days} days")
    print(f"CORS Origins:    {', '.join(settings.allowed_origins)}")
    print(f"Rate Limiting:   {'Enabled' if settings.rate_limit_enabled else 'Disabled'}")
    print("="*60 + "\n")
