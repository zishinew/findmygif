"""Gemini Vision API service for analyzing conversation screenshots."""

import json
import base64
from google import genai
from google.genai import types
from config import get_settings


ANALYSIS_PROMPT = """You are an expert at reading conversation screenshots and understanding social context.

Analyze this screenshot of a conversation. Extract the following information and return it as valid JSON:

{
  "conversation_text": "The actual text visible in the conversation, preserving who said what",
  "emotional_tone": "The dominant emotional tone of the conversation (e.g., sarcastic, excited, frustrated, playful, awkward, wholesome, angry, confused, flirty, deadpan)",
  "context_summary": "A 1-2 sentence summary of what's happening in this conversation",
  "gif_search_query": "The optimal 2-5 word search query to find the PERFECT reaction GIF to respond to this conversation. Be specific and expressive. Think about what reaction GIF would be the funniest or most fitting response."
}

Rules:
- The gif_search_query should capture the REACTION someone would have, not describe the conversation itself
- Be creative with the search query — think about popular reaction GIF categories
- If the tone is sarcastic, lean into that (e.g., "sure jan", "oh really", "slow clap")
- If excited, think big reactions (e.g., "mind blown", "happy dance", "freaking out")
- Return ONLY valid JSON, no markdown formatting, no code blocks
"""


async def analyze_screenshot(image_bytes: bytes, content_type: str) -> dict:
    """
    Analyze a conversation screenshot using Gemini Vision.
    
    Args:
        image_bytes: Raw bytes of the uploaded image.
        content_type: MIME type of the image (e.g., image/png).
    
    Returns:
        Dictionary with conversation_text, emotional_tone, context_summary, gif_search_query.
    """
    settings = get_settings()
    client = genai.Client(api_key=settings.gemini_api_key)

    # Create the image part from bytes
    image_part = types.Part.from_bytes(data=image_bytes, mime_type=content_type)

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[ANALYSIS_PROMPT, image_part],
        config=types.GenerateContentConfig(
            temperature=0.7,
            response_mime_type="application/json",
        ),
    )

    # Parse the JSON response
    result = json.loads(response.text)
    return result
