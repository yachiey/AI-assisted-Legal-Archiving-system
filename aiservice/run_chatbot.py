"""
Entry point to run the Chatbot Service
"""
import sys
import os
import logging

# Add the chatbot directory to Python path
chatbot_dir = os.path.join(os.path.dirname(__file__), 'chatbot')
sys.path.insert(0, chatbot_dir)

# Apply Windows fixes BEFORE any logging or model loading
from windows_fix import fix_windows_streams
fix_windows_streams()

# NOW configure logging safely
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

if __name__ == '__main__':
    logger.info("Starting Chatbot Service on port 5000...")

    # Change to chatbot directory to ensure relative imports work
    original_cwd = os.getcwd()
    os.chdir(chatbot_dir)

    try:
        # Import and run the chatbot service directly
        from chatbot_service import main
        main()
    except KeyboardInterrupt:
        logger.info("Chatbot Service stopped by user")
    except Exception as e:
        # Handle Windows Error 6 specifically for better debugging
        if "Windows error 6" in str(e) or "[WinError 6]" in str(e):
            logger.error("DANGER: Windows Invalid Handle (Error 6) detected despite stream redirection.")
            logger.error("This usually means a library is trying to access the console directly.")
            logger.error("Try running the service in a standard CMD window instead of a background/hidden one.")
        else:
            logger.error(f"Error running chatbot service: {str(e)}")
    finally:
        # Restore original working directory
        os.chdir(original_cwd)