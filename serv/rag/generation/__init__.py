"""
Generation Module

LLM-based response generation for FocusGuard RAG pipeline.

Supported Providers:
- **Hugging Face Inference API** (Recommended - Free tier, no credit card)
  - Mistral-7B-Instruct (fast, good quality)
  - Llama 3-8B-Instruct (excellent quality)
  - Zephyr-7B (optimized for chat)

- **OpenAI** (Requires payment)
  - GPT-3.5-turbo (fast, cheap)
  - GPT-4 (best quality, expensive)

- **Ollama** (Local, free, requires GPU)
  - Llama 3, Mistral, Phi-3

Quick Start:
    ```python
    from rag.generation.config import get_generator
    
    generator = get_generator()  # Auto-detects configured provider
    
    response = await generator.generate(
        query="How to avoid phone distractions?",
        context_documents=["Turn off notifications...", "Use app blockers..."],
        system_prompt="You are a productivity coach."
    )
    print(response)
    ```

Configuration:
    Set in .env:
    - HUGGINGFACE_API_KEY=hf_xxxxx (recommended)
    - OPENAI_API_KEY=sk-xxxxx (alternative)
    - USE_LOCAL_LLM=True (for Ollama)
"""

from .base_generator import BaseGenerator, GenerationConfig
from .huggingface_generator import HuggingFaceGenerator
from .config import get_generator, reset_generator
from . import prompts

__all__ = [
    "BaseGenerator",
    "GenerationConfig",
    "HuggingFaceGenerator",
    "get_generator",
    "reset_generator",
    "prompts"
]

