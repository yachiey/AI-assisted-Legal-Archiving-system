"""
Model management and loading functionality
"""
import os
import logging
import traceback
from llama_cpp import Llama
try:
    from .config import MODEL_PATH, N_BATCH, N_CTX, N_THREADS, N_GPU_LAYERS
except ImportError:
    from config import MODEL_PATH, N_BATCH, N_CTX, N_THREADS, N_GPU_LAYERS

logger = logging.getLogger(__name__)

class ModelManager:
    def __init__(self):
        self.model = None
        self.is_loaded = False

    def load_model(self):
        """Load the Llama GGUF model"""
        try:
            logger.info(f"Loading Llama model from {MODEL_PATH}")

            # Check if model file exists
            if not os.path.exists(MODEL_PATH):
                logger.error(f"Model file not found: {MODEL_PATH}")
                return False

            # Load model with CPU-optimized settings
            self.model = Llama(
                model_path=MODEL_PATH,
                n_ctx=N_CTX,  # Context window
                n_threads=N_THREADS,  # Number of threads for your Ryzen 7
                n_batch=N_BATCH,  # Faster prompt ingestion on CPU
                verbose=False,
                n_gpu_layers=N_GPU_LAYERS,  # Force CPU usage
            )

            self.is_loaded = True
            logger.info("Llama model loaded successfully on CPU!")
            return True

        except Exception as e:
            logger.error(f"Failed to load model: {str(e)}")
            logger.error(traceback.format_exc())
            self.is_loaded = False
            return False

    def get_model(self):
        """Get the loaded model instance"""
        return self.model if self.is_loaded else None

    def is_model_loaded(self):
        """Check if model is loaded"""
        return self.is_loaded

# Global model manager instance
model_manager = ModelManager()
