"""Application configuration loaded from environment variables."""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from .env file."""

    # API Keys
    gemini_api_key: str = "your_gemini_api_key_here"
    giphy_api_key: str = "your_giphy_api_key_here"
    pinecone_api_key: str = "your_pinecone_api_key_here"

    # Pinecone
    pinecone_index_name: str = "gif-finder"

    # Thresholding — minimum selections before a GIF appears as a recommendation
    selection_threshold: int = 5

    # Embedding dimensions (gemini-embedding-001)
    embedding_dimensions: int = 3072

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance."""
    return Settings()
