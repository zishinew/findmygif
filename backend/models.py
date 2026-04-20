"""Pydantic models for API request/response schemas."""

from pydantic import BaseModel
from typing import Optional


class GifResult(BaseModel):
    """A single GIF result."""
    id: str
    url: str
    preview_url: str
    title: str
    source: str  # "giphy" or "pinecone"
    selection_count: Optional[int] = None  # only for pinecone-sourced


class ContextMetadata(BaseModel):
    """Extracted context from the screenshot analysis."""
    conversation_text: str
    emotional_tone: str
    context_summary: str
    gif_search_query: str


class AnalysisResponse(BaseModel):
    """Response from the /analyze-screenshot endpoint."""
    context: ContextMetadata
    trending_gifs: list[GifResult]  # Pinecone-sourced (threshold met)
    fresh_gifs: list[GifResult]     # Giphy-sourced


class SelectionRequest(BaseModel):
    """Request body for the /select-gif endpoint."""
    gif_id: str
    gif_url: str
    gif_preview_url: str
    gif_title: str
    context_summary: str
    emotional_tone: str
    search_query: str


class SelectionResponse(BaseModel):
    """Response from the /select-gif endpoint."""
    success: bool
    message: str
    selection_count: int
