"""
Base class for LLM-based response generation.
"""

from abc import ABC, abstractmethod
from typing import List, Optional
from dataclasses import dataclass


@dataclass
class GenerationConfig:
    """
    Configuration for text generation.
    
    Attributes:
        temperature: Controls randomness (0.0 = deterministic, 1.0 = creative)
        max_tokens: Maximum length of generated response
        top_p: Nucleus sampling threshold
        presence_penalty: Penalize repeating topics
        frequency_penalty: Penalize repeating words
    """
    temperature: float = 0.7
    max_tokens: int = 500
    top_p: float = 1.0
    presence_penalty: float = 0.0
    frequency_penalty: float = 0.0


class BaseGenerator(ABC):
    """
    Abstract interface for LLM-based text generation.
    """
    
    @abstractmethod
    async def generate(
        self,
        query: str,
        context_documents: List[str],
        system_prompt: Optional[str] = None,
        config: Optional[GenerationConfig] = None
    ) -> str:
        """
        Generate a response using LLM with retrieved context.
        
        Args:
            query: User's original question
            context_documents: Relevant documents from retrieval phase
            system_prompt: Instructions for the LLM (role, tone, constraints)
            config: Generation parameters (temperature, max_tokens, etc.)
            
        Returns:
            Generated text response
            
        Example:
            response = await generator.generate(
                query="How can I stay focused?",
                context_documents=[
                    "Tip 1: Use the Pomodoro technique...",
                    "Tip 2: Eliminate phone distractions..."
                ],
                system_prompt="You are a productivity coach. Be concise and actionable."
            )
        """
        pass
    
    def _format_prompt(
        self,
        query: str,
        context_documents: List[str],
        system_prompt: Optional[str] = None
    ) -> str:
        """
        Build the final prompt sent to the LLM.
        
        Typical structure:
            System: You are a helpful assistant...
            
            Context:
            1. [Document 1]
            2. [Document 2]
            
            User Question: How can I focus better?
            
            Answer based on the context above:
        """
        context_text = "\n\n".join(
            f"{i+1}. {doc}" for i, doc in enumerate(context_documents)
        )
        
        prompt = f"""Context:
{context_text}

User Question: {query}

Answer based on the context above:"""
        
        if system_prompt:
            prompt = f"{system_prompt}\n\n{prompt}"
        
        return prompt
