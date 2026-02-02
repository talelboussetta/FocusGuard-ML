"""
Hugging Face Inference API Generator

Uses Hugging Face's hosted Inference API for text generation.
FREE tier available, no credit card required.

Recommended models:
- mistralai/Mistral-7B-Instruct-v0.2 (fast, good quality)
- meta-llama/Meta-Llama-3-8B-Instruct (excellent quality)
- HuggingFaceH4/zephyr-7b-beta (optimized for chat)
"""

import aiohttp
import asyncio
import logging
from typing import List, Optional, Dict, Any

from .base_generator import BaseGenerator, GenerationConfig


logger = logging.getLogger(__name__)


class HuggingFaceGenerator(BaseGenerator):
    """
    Text generation using Hugging Face Inference API.
    
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
    
    # Hugging Face Inference API endpoint
    API_BASE_URL = "https://api-inference.huggingface.co/models"
    
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
        self.endpoint = f"{self.API_BASE_URL}/{model}"
        
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
        
        # Prepare request payload
        payload = {
            "inputs": prompt,
            "parameters": {
                "temperature": config.temperature,
                "max_new_tokens": config.max_tokens,
                "top_p": config.top_p,
                "repetition_penalty": 1.0 + config.frequency_penalty,
                "do_sample": config.temperature > 0.0,
                "return_full_text": False  # Only return generated text, not input
            }
        }
        
        # Call API with retry logic
        response_text = await self._call_api_with_retry(payload)
        
        logger.info(f"Generated {len(response_text)} chars")
        return response_text
    
    async def _call_api_with_retry(self, payload: Dict[str, Any]) -> str:
        """
        Call Hugging Face API with exponential backoff retry.
        
        Args:
            payload: Request payload
            
        Returns:
            Generated text
            
        Raises:
            RuntimeError: If all retries fail
        """
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        last_error = None
        
        for attempt in range(self.max_retries + 1):
            try:
                async with aiohttp.ClientSession() as session:
                    timeout = aiohttp.ClientTimeout(total=self.timeout)
                    
                    async with session.post(
                        self.endpoint,
                        headers=headers,
                        json=payload,
                        timeout=timeout
                    ) as response:
                        
                        # Handle rate limiting (503) - model is loading
                        if response.status == 503:
                            data = await response.json()
                            estimated_time = data.get("estimated_time", 20)
                            logger.warning(
                                f"Model loading, estimated time: {estimated_time}s "
                                f"(attempt {attempt + 1}/{self.max_retries + 1})"
                            )
                            
                            if attempt < self.max_retries:
                                await asyncio.sleep(min(estimated_time, 30))
                                continue
                            else:
                                raise RuntimeError(
                                    f"Model loading timeout after {self.max_retries} retries"
                                )
                        
                        # Handle other errors
                        if response.status != 200:
                            error_text = await response.text()
                            raise RuntimeError(
                                f"HuggingFace API error {response.status}: {error_text}"
                            )
                        
                        # Parse response
                        result = await response.json()
                        
                        # Handle different response formats
                        if isinstance(result, list) and len(result) > 0:
                            # Standard format: [{"generated_text": "..."}]
                            return result[0].get("generated_text", "").strip()
                        elif isinstance(result, dict):
                            # Alternative format: {"generated_text": "..."}
                            return result.get("generated_text", "").strip()
                        else:
                            raise RuntimeError(f"Unexpected response format: {result}")
            
            except asyncio.TimeoutError:
                last_error = f"Request timeout after {self.timeout}s"
                logger.warning(f"{last_error} (attempt {attempt + 1}/{self.max_retries + 1})")
                
                if attempt < self.max_retries:
                    await asyncio.sleep(2 ** attempt)  # Exponential backoff
                    continue
            
            except aiohttp.ClientError as e:
                last_error = f"Network error: {str(e)}"
                logger.warning(f"{last_error} (attempt {attempt + 1}/{self.max_retries + 1})")
                
                if attempt < self.max_retries:
                    await asyncio.sleep(2 ** attempt)
                    continue
            
            except Exception as e:
                last_error = str(e)
                logger.error(f"Unexpected error: {last_error}")
                raise
        
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
