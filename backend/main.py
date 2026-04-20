"""Perfect GIF Finder — FastAPI Backend."""

import asyncio
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from models import (
    AnalysisResponse,
    ContextMetadata,
    SelectionRequest,
    SelectionResponse,
)
from services.vision import analyze_screenshot
from services.gif_search import search_gifs
from services.embeddings import generate_embedding, build_embedding_text
from services.vector_store import store_selection, query_similar

app = FastAPI(
    title="Perfect GIF Finder",
    description="Analyze conversation screenshots and find the perfect reaction GIF.",
    version="1.0.0",
)

# CORS — allow the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED_CONTENT_TYPES = {"image/png", "image/jpeg", "image/webp"}


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "gif-finder-api"}


@app.get("/trending-gifs")
async def trending_gifs_endpoint(limit: int = 20):
    """Return trending GIFs from Giphy for the homepage carousel."""
    import httpx
    settings = get_settings()
    params = {
        "api_key": settings.giphy_api_key,
        "limit": limit,
        "rating": "pg",
    }
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(
                "https://api.giphy.com/v1/gifs/trending", params=params, timeout=10.0
            )
            res.raise_for_status()
            data = res.json()
        gifs = [
            {
                "id": g["id"],
                "url": g["images"]["fixed_height"]["url"],
                "title": g.get("title", ""),
            }
            for g in data.get("data", [])
        ]
        return {"gifs": gifs}
    except Exception:
        return {"gifs": []}


@app.post("/analyze-screenshot", response_model=AnalysisResponse)
async def analyze_screenshot_endpoint(file: UploadFile = File(...)):
    """
    Analyze a conversation screenshot and return matching GIFs.
    
    1. Sends the image to Gemini Vision for context extraction.
    2. Searches Giphy for matching reaction GIFs.
    3. Queries Pinecone for trending community picks.
    4. Returns combined results.
    """
    # Validate file type
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{file.content_type}'. Accepted: PNG, JPEG, WebP.",
        )

    # Read image bytes
    image_bytes = await file.read()
    if len(image_bytes) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB.")

    # Step 1: Analyze the screenshot with Gemini Vision
    try:
        analysis = await analyze_screenshot(image_bytes, file.content_type)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Vision analysis failed: {str(e)}",
        )

    context = ContextMetadata(
        conversation_text=analysis.get("conversation_text", ""),
        emotional_tone=analysis.get("emotional_tone", ""),
        context_summary=analysis.get("context_summary", ""),
        gif_search_query=analysis.get("gif_search_query", ""),
    )

    # Step 2: Search Giphy + query Pinecone in parallel
    try:
        # Build embedding text for Pinecone query
        embedding_text = build_embedding_text(
            context.context_summary, context.emotional_tone, context.gif_search_query
        )

        # Run GIF search and embedding generation in parallel
        giphy_task = search_gifs(context.gif_search_query)
        embedding_task = generate_embedding(embedding_text)

        fresh_gifs, embedding = await asyncio.gather(giphy_task, embedding_task)

        # Query Pinecone for trending picks
        try:
            trending_gifs = await query_similar(embedding)
        except Exception:
            # Pinecone may not be configured yet — gracefully degrade
            trending_gifs = []

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"GIF search failed: {str(e)}",
        )

    return AnalysisResponse(
        context=context,
        trending_gifs=trending_gifs,
        fresh_gifs=fresh_gifs,
    )


@app.post("/select-gif", response_model=SelectionResponse)
async def select_gif_endpoint(selection: SelectionRequest):
    """
    Record a user's GIF selection for the global trend-learning engine.
    
    1. Generates a semantic embedding of the context + selected GIF.
    2. Stores/updates the vector in Pinecone with frequency counting.
    """
    try:
        # Generate embedding from the context
        embedding_text = build_embedding_text(
            selection.context_summary,
            selection.emotional_tone,
            selection.search_query,
        )
        embedding = await generate_embedding(embedding_text)

        # Store in Pinecone
        count = await store_selection(
            embedding=embedding,
            gif_id=selection.gif_id,
            gif_url=selection.gif_url,
            gif_preview_url=selection.gif_preview_url,
            gif_title=selection.gif_title,
            context_summary=selection.context_summary,
            emotional_tone=selection.emotional_tone,
            search_query=selection.search_query,
        )

        return SelectionResponse(
            success=True,
            message=f"Selection recorded! This GIF has been chosen {count} time(s) for similar contexts.",
            selection_count=count,
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to record selection: {str(e)}",
        )
