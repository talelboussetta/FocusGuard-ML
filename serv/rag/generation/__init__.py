"""
Generation Module

Uses LLMs to generate responses based on retrieved documents.

Supported LLM providers:
- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude)
- Local models (Ollama, LLaMA)

Example usage:
    generator = OpenAIGenerator(model="gpt-4")
    response = await generator.generate(
        query="How to avoid phone distractions?",
        context_documents=[doc1, doc2, doc3],
        system_prompt="You are a focus coach..."
    )
"""
