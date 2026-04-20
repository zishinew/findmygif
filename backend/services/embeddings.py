"""Gemini text embedding service for semantic similarity."""

from google import genai
from config import get_settings


async def generate_embedding(text: str) -> list[float]:
    """
    Generate a semantic embedding for the given text using Gemini.
    
    Args:
        text: The text to embed (typically context + tone + query combined).
    
    Returns:
        A list of 768 float values representing the embedding vector.
    """
    settings = get_settings()
    client = genai.Client(api_key=settings.gemini_api_key)

    result = client.models.embed_content(
        model="gemini-embedding-001",
        contents=text,
    )

    # The response contains a list of embeddings; we take the first one
    return list(result.embeddings[0].values)


def build_embedding_text(context_summary: str, emotional_tone: str, search_query: str) -> str:
    """
    Combine context fields into a single string for embedding.
    
    Args:
        context_summary: Summary of the conversation.
        emotional_tone: Detected emotional tone.
        search_query: The GIF search query.
    
    Returns:
        A combined string suitable for embedding.
    """
    return f"Context: {context_summary} | Tone: {emotional_tone} | Reaction: {search_query}"
