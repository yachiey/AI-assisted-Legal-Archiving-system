"""
Main Flask application for AI Bridge Service
"""
import os
import sys
import logging
from pathlib import Path
from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS
from config import CORS_ORIGINS
from model_loader import load_embedding_model, load_llama_model
from routes import register_routes

# Fix Windows console encoding issues
if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'
    # Disable colorama to avoid Windows console errors
    os.environ['NO_COLOR'] = '1'

# Load environment variables from .env file
env_path = Path(__file__).parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)
logger.info(f"Loading .env from: {env_path}")

def create_app():
    """Create and configure Flask application"""
    app = Flask(__name__)
    CORS(app, origins=CORS_ORIGINS)
    
    # Register all routes
    register_routes(app)
    
    return app

if __name__ == '__main__':
    logger.info("Starting AI Bridge Service...")
    logger.info("Loading BERT embedding model...")

    model_loaded = load_embedding_model()

    if not model_loaded:
        logger.warning("Embedding model not loaded, some features will be limited")

    logger.info("Loading Llama model for offline fallback (used when Groq is unavailable)...")
    llama_loaded = load_llama_model()
    if not llama_loaded:
        logger.warning("Llama model not loaded — offline fallback unavailable, will use rule-based generation")
    
    app = create_app()
    
    logger.info("AI Bridge Service starting on port 5003")
    logger.info("Endpoints available:")
    logger.info("  - Health check: GET /health")
    logger.info("  - Process document: POST /api/documents/process-ai")
    logger.info("  - Analyze document: POST /api/documents/analyze")
    logger.info("  - Document similarity: POST /api/documents/similarity")
    logger.info("  - Semantic search: POST /api/documents/search")

    # Use werkzeug directly to avoid Flask CLI console issues on Windows
    from werkzeug.serving import run_simple
    print("\n" + "=" * 60)
    print("AI Bridge Service is READY on http://127.0.0.1:5003")
    print("=" * 60 + "\n")
    run_simple('0.0.0.0', 5003, app, use_reloader=False, threaded=True)