"""Vercel serverless entry point — wraps the FastAPI backend."""
import sys
import os

# Add backend directory to Python path so imports work
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from fastapi import FastAPI
from main import app as backend_app

# Mount the backend app under /api so routes match Vercel's routing
app = FastAPI()
app.mount("/api", backend_app)
