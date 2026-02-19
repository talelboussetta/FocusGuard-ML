"""
Generation Module Configuration

Provides singleton access to configured LLM generator.
Supports multiple providers: Hugging Face, OpenAI, Anthropic, Ollama.
"""

import logging
from typing import Optional

from api.config import settings
from .base_generator import BaseGenerator
from .huggingface_generator import HuggingFaceGenerator


logger = logging.getLogger(__name__)


# Singleton instance
_generator_instance: Optional[BaseGenerator] = None


def get_generator() -> BaseGenerator:
    """
    Get configured LLM generator (singleton pattern).
    
    Provider priority:
    1. Hugging Face Inference API (if HUGGINGFACE_API_KEY is set)
    2. OpenAI (if OPENAI_API_KEY is set and not using local)
    3. Ollama (if USE_LOCAL_LLM=True)
    
    Returns:
        Configured generator instance
        
    Raises:
        ValueError: If no valid configuration found
        
    Example:
        ```python
        generator = get_generator()
        response = await generator.generate(
            query="How to focus?",
            context_documents=["Use Pomodoro..."]
        )
        ```
    """
    global _generator_instance
    
    if _generator_instance is not None:
        return _generator_instance
    
    # Priority 1: Hugging Face (recommended - free, no card needed)
    if settings.huggingface_api_key:
        logger.info(f"Using Hugging Face generator: {settings.huggingface_model}")
        _generator_instance = HuggingFaceGenerator(
            api_key=settings.huggingface_api_key,
            model=settings.huggingface_model,
            timeout=settings.llm_timeout_seconds,
            max_retries=settings.llm_max_retries
        )
        return _generator_instance
    
    # Priority 2: OpenAI (requires payment)
    if settings.openai_api_key and not settings.use_local_llm:
        logger.info(f"Using OpenAI generator: {settings.openai_chat_model}")
        # TODO: Implement OpenAIGenerator when needed
        raise NotImplementedError(
            "OpenAI generator not yet implemented. "
            "Use Hugging Face (set HUGGINGFACE_API_KEY) or implement OpenAIGenerator."
        )
    
    # Priority 3: Ollama (local, requires installation)
    if settings.use_local_llm:
        logger.info(f"Using Ollama generator: {settings.ollama_model}")
        # TODO: Implement OllamaGenerator when needed
        raise NotImplementedError(
            "Ollama generator not yet implemented. "
            "Use Hugging Face (set HUGGINGFACE_API_KEY) or implement OllamaGenerator."
        )
    
    # No valid configuration
    raise ValueError(
        "No LLM provider configured. Set one of:\n"
        "- HUGGINGFACE_API_KEY (recommended - free)\n"
        "- OPENAI_API_KEY (requires payment)\n"
        "- USE_LOCAL_LLM=True with Ollama installed"
    )


def reset_generator() -> None:
    """
    Reset generator singleton (useful for testing).
    """
    global _generator_instance
    _generator_instance = None
