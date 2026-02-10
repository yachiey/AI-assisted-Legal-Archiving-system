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

    # Fix for Windows console output issues
    os.environ['PYTHONIOENCODING'] = 'utf-8'

    # Fix Windows invalid handle error (error 6) when launched via 'start cmd /k'
    import sys
    try:
        sys.stdout.write('')
        sys.stdout.flush()
    except OSError:
        sys.stdout = open(os.devnull, 'w')
    try:
        sys.stderr.write('')
        sys.stderr.flush()
    except OSError:
        sys.stderr = open(os.devnull, 'w')

    # Disable Flask's banner to avoid console issues
    logging.getLogger('werkzeug').setLevel(logging.ERROR)

    # Create and run the app
    app = create_app()
    app.run(host=HOST, port=PORT, debug=DEBUG, threaded=True, use_reloader=False)

if __name__ == '__main__':
    main()