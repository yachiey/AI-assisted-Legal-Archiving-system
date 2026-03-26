"""
Configuration settings for the Chatbot service
"""
import os

# Configuration for Llama 3.2
# Get absolute path to model file - go up to project root then into storage
_current_dir = os.path.dirname(__file__)  # chatbot directory
_aiservice_dir = os.path.dirname(_current_dir)  # aiservice directory
_project_root = os.path.dirname(_aiservice_dir)  # Legal_Arch_aiu directory
MODEL_PATH = os.path.join(_project_root, "storage", "app", "models", "Llama-3.2-3B-Instruct-Q8_0-GGUF", "llama-3.2-3b-instruct-q8_0.gguf")
# Favor shorter local responses so CPU generation stays responsive.
MAX_TOKENS = 256
TEMPERATURE = 0.7
TOP_P = 0.9

# Server configuration
HOST = '0.0.0.0'
PORT = 5000
DEBUG = False

# Model loading configuration
N_CTX = 3072  # Slightly smaller context keeps local chat faster without heavily cutting recall
N_THREADS = max(4, min(8, (os.cpu_count() or 4) // 2))  # Good default for mid-range CPUs
N_BATCH = 256  # Prompt ingestion tuning for llama-cpp on CPU
N_GPU_LAYERS = 0  # Force CPU usage

# Conversation limits
MAX_HISTORY_MESSAGES = 12  # Keep only last 12 messages (6 exchanges) for memory efficiency
RECENT_HISTORY_LIMIT = 6  # Last 6 messages for context
MAX_MESSAGE_LENGTH = 500  # Limit message length for CPU efficiency

# Timeout settings
GENERATION_TIMEOUT = 180  # Increased to 3 minutes for document processing
