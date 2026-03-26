"""
Main Chatbot service using Llama 3.2 with organized code structure
"""
import os
import logging
from flask import Flask
from flask_cors import CORS
try:
    from .config import HOST, PORT, DEBUG
    from .model_manager import model_manager
    from .routes import register_routes
except ImportError:
    from config import HOST, PORT, DEBUG
    from model_manager import model_manager
    from routes import register_routes
from windows_fix import disable_click_echo, silence_werkzeug

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_app():
    """Create and configure the Flask application"""
    app = Flask(__name__)
    CORS(app)  # Enable CORS for all routes

    # Register all routes
    register_routes(app)

    return app

def main():
    """Main entry point for the Chatbot service"""
    logger.info("Starting Flask AI Chatbot Service with Llama 3.2...")
    logger.info("Loading model (this may take 1-2 minutes)...")

    # Load the model
    model_loaded = model_manager.load_model()

    if not model_loaded:
        logger.error("Failed to load model. Exiting...")
        exit(1)

    logger.info("Model loaded successfully! Starting Flask server...")
    logger.info(f"Server will be available at: http://{HOST}:{PORT}")
    logger.info(f"Health check endpoint: http://{HOST}:{PORT}/health")

    # Standardizing console output and encoding for Windows compatibility
    # Disable Click's console echoing which often causes Error 6 on Windows
    disable_click_echo()

    # Disable Flask's banner and werkzeug logs to avoid console issues
    silence_werkzeug()

    # Create and run the app
    app = create_app()
    app.run(host=HOST, port=PORT, debug=DEBUG, threaded=True, use_reloader=False)

if __name__ == '__main__':
    main()