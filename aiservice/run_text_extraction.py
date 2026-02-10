"""
Entry point to run the Text Extraction Service
"""
import sys
import os

# Add the text_extraction directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'text_extraction'))

# Import and run the text extraction service
import subprocess
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def load_env_file(env_path):
    """Manually parse .env file simple key=value pairs"""
    env_vars = {}
    try:
        if os.path.exists(env_path):
            logger.info(f"Loading environment from {env_path}")
            with open(env_path, 'r') as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith('#') or '=' not in line:
                        continue
                    key, value = line.split('=', 1)
                    # Remove surrounding quotes if present
                    value = value.strip()
                    if (value.startswith('"') and value.endswith('"')) or \
                       (value.startswith("'") and value.endswith("'")):
                        value = value[1:-1]
                    env_vars[key.strip()] = value
            return env_vars
        else:
            logger.warning(f".env file not found at {env_path}")
            return {}
    except Exception as e:
        logger.error(f"Error loading .env file: {e}")
        return {}

if __name__ == '__main__':
    logger.info("Starting Text Extraction Service on port 5002...")
    
    # Get the path to the text extraction service file
    base_dir = os.path.dirname(__file__)
    text_extraction_path = os.path.join(base_dir, 'text_extraction', 'text_extraction_service.py')
    
    # Use aiservice_env (where Docling is installed)
    python_path = os.path.join(base_dir, 'aiservice_env', 'Scripts', 'python.exe')
    
    # Load .env variables from project root (parent directory)
    env_path = os.path.join(os.path.dirname(base_dir), '.env')
    project_env = load_env_file(env_path)
    
    # Merge with current environment
    current_env = os.environ.copy()
    current_env.update(project_env)
    
    # Run the text extraction service with updated environment
    try:
        subprocess.run([python_path, text_extraction_path], env=current_env, check=True)
    except KeyboardInterrupt:
        logger.info("Text Extraction Service stopped by user")
    except Exception as e:
        logger.error(f"Error running text extraction service: {str(e)}")