"""Pinecone vector store for the global trend-learning engine."""

import hashlib
import json
from pinecone import Pinecone, ServerlessSpec
from config import get_settings
from models import GifResult

# Module-level index reference (initialized lazily)
_index = None


def _get_index():
    """Get or create the Pinecone index (lazy initialization)."""
    global _index
    if _index is not None:
        return _index

    settings = get_settings()
    pc = Pinecone(api_key=settings.pinecone_api_key)

    # Create index if it doesn't exist
    existing_indexes = [idx.name for idx in pc.list_indexes()]
    if settings.pinecone_index_name not in existing_indexes:
        pc.create_index(
            name=settings.pinecone_index_name,
            dimension=settings.embedding_dimensions,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1"),
        )

    _index = pc.Index(settings.pinecone_index_name)
    return _index


def _generate_vector_id(context_summary: str, gif_id: str) -> str:
    """
    Generate a deterministic vector ID from context + gif pairing.
    This ensures duplicate selections increment the same vector.
    """
    raw = f"{context_summary.strip().lower()}::{gif_id}"
    return hashlib.sha256(raw.encode()).hexdigest()[:32]


async def store_selection(
    embedding: list[float],
    gif_id: str,
    gif_url: str,
    gif_preview_url: str,
    gif_title: str,
    context_summary: str,
    emotional_tone: str,
    search_query: str,
) -> int:
    """
    Store or update a GIF selection in Pinecone with frequency tracking.
    
    If this exact context+gif pairing already exists, increments the
    selection_count. Otherwise, creates a new vector.
    
    Returns:
        The current selection_count after this operation.
    """
    index = _get_index()
    vector_id = _generate_vector_id(context_summary, gif_id)

    # Check if this pairing already exists
    try:
        fetch_result = index.fetch(ids=[vector_id])
        existing = fetch_result.vectors.get(vector_id)
    except Exception:
        existing = None

    if existing and existing.metadata:
        # Increment the selection count
        current_count = existing.metadata.get("selection_count", 0) + 1
    else:
        current_count = 1

    # Upsert with updated count
    metadata = {
        "gif_id": gif_id,
        "gif_url": gif_url,
        "gif_preview_url": gif_preview_url,
        "gif_title": gif_title,
        "context_summary": context_summary,
        "emotional_tone": emotional_tone,
        "search_query": search_query,
        "selection_count": current_count,
    }

    index.upsert(
        vectors=[
            {
                "id": vector_id,
                "values": embedding,
                "metadata": metadata,
            }
        ]
    )

    return current_count


async def query_similar(
    embedding: list[float], top_k: int = 10
) -> list[GifResult]:
    """
    Query Pinecone for similar context vectors that meet the selection threshold.
    
    Only returns results where selection_count >= SELECTION_THRESHOLD.
    
    Args:
        embedding: The query embedding vector.
        top_k: Maximum number of results to retrieve before filtering.
    
    Returns:
        List of GifResult objects that have passed the threshold.
    """
    settings = get_settings()
    index = _get_index()

    results = index.query(
        vector=embedding,
        top_k=top_k,
        include_metadata=True,
    )

    trending_gifs = []
    for match in results.matches:
        metadata = match.metadata or {}
        count = metadata.get("selection_count", 0)

        # Only include results that meet the threshold
        if count >= settings.selection_threshold:
            trending_gifs.append(
                GifResult(
                    id=metadata.get("gif_id", match.id),
                    url=metadata.get("gif_url", ""),
                    preview_url=metadata.get("gif_preview_url", ""),
                    title=metadata.get("gif_title", "Trending GIF"),
                    source="pinecone",
                    selection_count=count,
                )
            )

    return trending_gifs
