
import sys
import os

with open("test_results.txt", "w") as f:
    f.write(f"Testing imports with Python {sys.version}...\n\n")

    # 1. Test PyTorch (CPU)
    try:
        import torch
        f.write(f"torch: Success (Version: {torch.__version__}, CUDA: {torch.cuda.is_available()})\n")
    except Exception as e:
        f.write(f"torch: FAILED: {e}\n")

    # 2. Test Sentence Transformers (Embedding Model)
    try:
        from sentence_transformers import SentenceTransformer
        f.write("sentence_transformers: Success (Import only)\n")
    except Exception as e:
        f.write(f"sentence_transformers: FAILED: {e}\n")

    # 3. Test Llama CPP (Chatbot)
    try:
        from llama_cpp import Llama
        f.write("llama_cpp: Success (Import only)\n")
    except Exception as e:
        f.write(f"llama_cpp: FAILED: {e}\n")

    # 4. Test Paddle (OCR) - if strictly needed
    try:
        import paddle
        f.write(f"paddle: Success (Version: {paddle.__version__})\n")
    except Exception as e:
        f.write(f"paddle: FAILED: {e}\n")
