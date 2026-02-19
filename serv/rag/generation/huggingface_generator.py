"""
Hugging Face Inference API Generator

Uses Hugging Face's hosted Inference API for text generation.
FREE tier available, no credit card required.

Recommended models:
- mistralai/Mistral-7B-Instruct-v0.2 (fast, good quality)
- meta-llama/Meta-Llama-3-8B-Instruct (excellent quality)
- HuggingFaceH4/zephyr-7b-beta (optimized for chat)
"""

import asyncio
import logging
from typing import List, Optional

from huggingface_hub import AsyncInferenceClient
from huggingface_hub.utils import HfHubHTTPError

from .base_generator import BaseGenerator, GenerationConfig


logger = logging.getLogger(__name__)


class HuggingFaceGenerator(BaseGenerator):
    """
    Text generation using Hugging Face Inference API.
    
    Uses the official huggingface_hub client for reliable API access.
    
    Features:
    - Free tier: 1000 requests/day
    - No credit card required
    - Multiple model options
    - Automatic retry on rate limits
    
    Example:
        ```python
        generator = HuggingFaceGenerator(
            api_key="hf_xxxxx",
            model="mistralai/Mistral-7B-Instruct-v0.2"
        )
        
        response = await generator.generate(
            query="How to focus better?",
            context_documents=["Use Pomodoro...", "Eliminate distractions..."],
            system_prompt="You are a productivity coach."
        )
        ```
    """
    
    def __init__(
        self,
        api_key: str,
        model: str = "mistralai/Mistral-7B-Instruct-v0.2",
        timeout: int = 30,
        max_retries: int = 2
    ):
        """
        Initialize Hugging Face generator.
        
        Args:
            api_key: Hugging Face API key (get from hf.co/settings/tokens)
            model: Model ID on Hugging Face Hub
            timeout: Request timeout in seconds
            max_retries: Maximum retry attempts
        """
        self.api_key = api_key
        self.model = model
        self.timeout = timeout
        self.max_retries = max_retries
        
        # Initialize official HF client
        self.client = AsyncInferenceClient(token=api_key)
        
        logger.info(f"Initialized HuggingFace generator with model: {model}")
    
    async def generate(
        self,
        query: str,
        context_documents: List[str],
        system_prompt: Optional[str] = None,
        config: Optional[GenerationConfig] = None
    ) -> str:
        """
        Generate response using Hugging Face Inference API.
        
        Args:
            query: User's question
            context_documents: Retrieved documents for context
            system_prompt: System instructions (optional)
            config: Generation parameters
            
        Returns:
            Generated text response
        """
        config = config or GenerationConfig()
        
        # Build prompt using inherited method
        prompt = self._format_prompt(query, context_documents, system_prompt)
        
        logger.info(f"Generating response for query: '{query[:50]}...'")
        logger.debug(f"Prompt length: {len(prompt)} chars")
        
        # Call API with retry logic
        response_text = await self._call_api_with_retry(prompt, config)
        
        logger.info(f"Generated {len(response_text)} chars")
        return response_text
    
    async def _call_api_with_retry(self, prompt: str, config: GenerationConfig) -> str:
        """
        Call Hugging Face API with exponential backoff retry.
        
        Args:
            prompt: Formatted prompt
            config: Generation configuration
            
        Returns:
            Generated text
            
        Raises:
            RuntimeError: If all retries fail
        """
        last_error = None
        
        for attempt in range(self.max_retries + 1):
            try:
                logger.debug(f"API call attempt {attempt + 1}/{self.max_retries + 1}")
                
                # Use chat_completion for instruction-tuned models
                response = await self.client.chat_completion(
                    messages=[{"role": "user", "content": prompt}],
                    model=self.model,
                    max_tokens=config.max_tokens,
                    temperature=config.temperature,
                    top_p=config.top_p,
                    frequency_penalty=config.frequency_penalty
                )
                
                # Extract generated text from response
                if hasattr(response, 'choices') and len(response.choices) > 0:
                    return response.choices[0].message.content.strip()
                elif isinstance(response, str):
                    return response.strip()
                else:
                    raise RuntimeError(f"Unexpected response type: {type(response)}")
            
            except HfHubHTTPError as e:
                # Handle model loading (503) - retry with backoff
                if e.response.status_code == 503:
                    logger.warning(
                        f"Model loading (attempt {attempt + 1}/{self.max_retries + 1})"
                    )
                    if attempt < self.max_retries:
                        wait_time = min(20, 2 ** attempt)
                        await asyncio.sleep(wait_time)
                        continue
                
                # Other HTTP errors
                last_error = f"HuggingFace API error {e.response.status_code}: {str(e)}"
                logger.error(last_error)
                
                if attempt < self.max_retries:
                    await asyncio.sleep(2 ** attempt)
                    continue
                else:
                    raise RuntimeError(last_error)
            
            except asyncio.TimeoutError:
                last_error = f"Request timeout after {self.timeout}s"
                logger.warning(f"{last_error} (attempt {attempt + 1}/{self.max_retries + 1})")
                
                if attempt < self.max_retries:
                    await asyncio.sleep(2 ** attempt)
                    continue
            
            except Exception as e:
                last_error = f"Unexpected error: {str(e)}"
                logger.error(last_error)
                raise RuntimeError(last_error)
        
        # All retries failed
        raise RuntimeError(f"Failed after {self.max_retries + 1} attempts: {last_error}")
    
    def _format_prompt(
        self,
        query: str,
        context_documents: List[str],
        system_prompt: Optional[str] = None
    ) -> str:
        """
        Format prompt for instruction-tuned models.
        
        Uses the Mistral/Llama instruction format:
        [INST] {system_prompt}
        
        Context: {documents}
        
        Question: {query} [/INST]
        """
        # Build context section
        context_text = "\n\n".join(
            f"Document {i+1}: {doc}" 
            for i, doc in enumerate(context_documents)
        )
        
        # Default system prompt for FocusGuard
        if not system_prompt:
            system_prompt = (
                "You are a focus and productivity coach. "
                "Provide concise, actionable advice based on the context provided. "
                "Be empathetic and encouraging."
            )
        
        # Format in instruction style (works for Mistral, Llama, Zephyr)
        prompt = f"""[INST] {system_prompt}

Context:
{context_text}

Question: {query}

Provide a helpful, concise answer based on the context above. [/INST]"""
        
        return prompt
