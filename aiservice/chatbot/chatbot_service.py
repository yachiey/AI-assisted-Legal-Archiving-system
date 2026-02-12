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

    # Fix for Windows console output issues and invalid handles
    os.environ['PYTHONIOENCODING'] = 'utf-8'
    os.environ['ANSI_COLORS_DISABLED'] = '1' # Prevent colorama from accessing console handles

    # Robust fix for Windows invalid handle error (Error 6)
    # This often happens when running as a background service or subprocess
    import sys
    
    def _fix_stream(stream, mode):
        # Always redirect stdin to devnull to prevent read errors in service mode
        if mode == 'r':
            return open(os.devnull, mode)
            
        try:
            if stream is None or hasattr(stream, 'closed') and stream.closed:
                return open(os.devnull, mode)
            
            # Force validation by trying to interact with the stream
            try:
                stream.fileno()
            except (OSError, ValueError):
                # fileno failed, it's definitely invalid
                return open(os.devnull, mode)
            
            # Try a test write for output streams to ensure the handle is actually writable
            if 'w' in mode:
                try:
                    stream.write('')
                    # Flush is critical to catch buffering errors
                    if hasattr(stream, 'flush'):
                        stream.flush()
                except (OSError, ValueError, IOError):
                    # Write failed, redirect to devnull
                    return open(os.devnull, mode)
                    
            return stream
        except Exception:
            # Catch-all for any other weird errors
            return open(os.devnull, mode)

    # Apply fixes to all standard streams
    sys.stdout = _fix_stream(sys.stdout, 'w')
    sys.stderr = _fix_stream(sys.stderr, 'w')
    sys.stdin = _fix_stream(sys.stdin, 'r')

    # Disable Flask's banner to avoid console issues
    logging.getLogger('werkzeug').setLevel(logging.ERROR)

    # Create and run the app
    app = create_app()
    app.run(host=HOST, port=PORT, debug=DEBUG, threaded=True, use_reloader=False)

if __name__ == '__main__':
    main()