"""
FocusGuard API - Configuration Management

Loads environment variables and provides application configuration.
Uses pydantic-settings for type-safe configuration management.
"""

from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator


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
    
    allowed_origins: Union[str, List[str]] = Field(
        default=[
            "http://localhost:5173",  # Vite dev server
            "http://localhost:5174",  # Vite dev server (alternate port)
            "http://localhost:5175",  # Vite dev server (alternate port)
            "http://localhost:3000",  # React dev server
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
            "http://127.0.0.1:5175",
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
    # Error Tracking & Monitoring (Sentry)
    # ========================================================================
    
    sentry_dsn: str = Field(
        default="",
        description="Sentry DSN for error tracking (leave empty to disable)"
    )
    
    sentry_environment: str = Field(
        default="development",
        description="Environment name for Sentry (development, staging, production)"
    )
    
    sentry_traces_sample_rate: float = Field(
        default=1.0,
        description="Sentry performance monitoring sample rate (0.0 to 1.0)"
    )
    
    # ========================================================================
    # RAG & Vector Store Settings (Qdrant)
    # ========================================================================
    
    qdrant_url: str = Field(
        default="http://localhost:6333",
        description="Qdrant server URL (local Docker or cloud)"
    )
    
    qdrant_api_key: str = Field(
        default="",
        description="Qdrant API key (required for Qdrant Cloud, leave empty for local)"
    )
    
    qdrant_collection_name: str = Field(
        default="focusguard_knowledge",
        description="Qdrant collection name for RAG documents"
    )
    
    qdrant_vector_size: int = Field(
        default=1536,
        description="Vector embedding dimension (1536 for OpenAI text-embedding-3-small)"
    )
    
    # ========================================================================
    # OpenAI Settings (Embeddings)
    # ========================================================================
    
    openai_api_key: str = Field(
        default="",
        description="OpenAI API key for embeddings and LLM"
    )
    
    openai_embedding_model: str = Field(
        default="text-embedding-3-small",
        description="OpenAI embedding model (text-embedding-3-small, text-embedding-3-large)"
    )
    
    # ========================================================================
    # Sentence Transformers Settings (Local Embeddings)
    # ========================================================================
    
    use_local_embeddings: bool = Field(
        default=False,
        description="Use local sentence-transformers instead of OpenAI (free, offline)"
    )
    
    sentence_transformer_model: str = Field(
        default="all-MiniLM-L6-v2",
        description="Sentence transformer model name (all-MiniLM-L6-v2, all-mpnet-base-v2)"
    )
    
    sentence_transformer_device: str = Field(
        default="cpu",
        description="Device for sentence transformers (cpu, cuda, mps)"
    )
    
    # ========================================================================
    # LLM Generation Settings
    # ========================================================================
    
    use_local_llm: bool = Field(
        default=False,
        description="Use local LLM instead of API-based models (Ollama, LlamaCpp)"
    )
    
    # OpenAI LLM Settings
    openai_chat_model: str = Field(
        default="gpt-3.5-turbo",
        description="OpenAI chat model for generation (gpt-4, gpt-3.5-turbo, gpt-4-turbo)"
    )
    
    openai_temperature: float = Field(
        default=0.7,
        ge=0.0,
        le=2.0,
        description="Sampling temperature for OpenAI (0.0=deterministic, 2.0=very creative)"
    )
    
    openai_max_tokens: int = Field(
        default=500,
        ge=1,
        le=4096,
        description="Maximum tokens in generated response"
    )
    
    # Anthropic Claude Settings (Alternative)
    anthropic_api_key: str = Field(
        default="",
        description="Anthropic API key for Claude models (optional alternative to OpenAI)"
    )
    
    anthropic_model: str = Field(
        default="claude-3-sonnet-20240229",
        description="Anthropic model (claude-3-opus, claude-3-sonnet, claude-3-haiku)"
    )
    
    # Hugging Face Inference API Settings (Recommended - Free & Easy)
    huggingface_api_key: str = Field(
        default="",
        description="Hugging Face API key for Inference API (free tier available)"
    )
    
    huggingface_model: str = Field(
        default="mistralai/Mistral-7B-Instruct-v0.2",
        description="HuggingFace model ID (mistralai/Mistral-7B-Instruct-v0.2, meta-llama/Meta-Llama-3-8B-Instruct)"
    )
    
    # Local LLM Settings (Ollama, LlamaCpp) - Optional Alternative
    ollama_base_url: str = Field(
        default="http://localhost:11434",
        description="Ollama server URL for local LLM inference"
    )
    
    ollama_model: str = Field(
        default="llama3:8b",
        description="Ollama model name (llama3:8b, mistral, phi3, etc.)"
    )
    
    llm_timeout_seconds: int = Field(
        default=30,
        ge=5,
        le=300,
        description="Timeout for LLM API calls in seconds"
    )
    
    llm_max_retries: int = Field(
        default=2,
        ge=0,
        le=5,
        description="Maximum retry attempts for failed LLM requests"
    )
    
    # ========================================================================
    # RAG Pipeline Settings
    # ========================================================================
    
    rag_retrieval_top_k: int = Field(
        default=5,
        ge=1,
        le=20,
        description="Number of documents to retrieve for RAG context"
    )
    
    rag_score_threshold: float = Field(
        default=0.3,
        ge=0.0,
        le=1.0,
        description="Minimum similarity score for retrieved documents"
    )
    
    rag_enable_reranking: bool = Field(
        default=False,
        description="Enable cross-encoder reranking of retrieved documents"
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
    
    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        """Parse CORS origins from comma-separated string or list."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        elif isinstance(v, list):
            return v
        return []


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
