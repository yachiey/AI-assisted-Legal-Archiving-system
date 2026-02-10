from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import os
import traceback
import re
from datetime import datetime
import requests
import base64
import io
import time
import fitz  # PyMuPDF
from PIL import Image

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Try to import Docling
try:
    from docling.document_converter import DocumentConverter
    DOCLING_AVAILABLE = True
    logger.info("Docling library loaded successfully")
except ImportError as e:
    DOCLING_AVAILABLE = False
    logger.error(f"Docling not available: {e}")

app = Flask(__name__)
CORS(app)

class GroqVisionExtractor:
    def __init__(self, api_key, model="meta-llama/llama-4-scout-17b-16e-instruct"):
        self.api_key = api_key
        self.model = model
        self.api_url = "https://api.groq.com/openai/v1/chat/completions"
        logger.info(f"Initialized GroqVisionExtractor with model: {model}")

    def is_online(self):
        """Check if Groq API is reachable"""
        try:
            requests.get("https://api.groq.com", timeout=3)
            return True
        except:
            return False

    def encode_image(self, image):
        """Encode PIL Image to base64 string with compression"""
        buffered = io.BytesIO()
        image.save(buffered, format="JPEG", quality=85)
        return base64.b64encode(buffered.getvalue()).decode('utf-8')

    def _process_single_page(self, page_num, image, total_pages):
        """Process a single page with Groq Vision (used for parallel execution)"""
        logger.info(f"Processing page {page_num+1}/{total_pages} with Groq Vision...")

        base64_image = self.encode_image(image)

        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Transcribe the text from this document image EXACTLY as it appears. Use markdown to format headers, lists, and tables. Do not summarize or explain. Output ONLY the extracted text content."
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}",
                                "detail": "high"
                            }
                        }
                    ]
                }
            ],
            "temperature": 0.0,
            "max_tokens": 8192
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        # Retry logic
        for attempt in range(3):
            try:
                response = requests.post(self.api_url, headers=headers, json=payload, timeout=60)

                if response.status_code == 200:
                    content = response.json()['choices'][0]['message']['content']
                    return (page_num, content)
                elif response.status_code == 429:
                    wait_time = (attempt + 1) * 2
                    logger.warning(f"Page {page_num+1} rate limited. Waiting {wait_time}s...")
                    time.sleep(wait_time)
                else:
                    logger.error(f"Page {page_num+1} Groq API error: {response.status_code} - {response.text}")
                    break
            except Exception as e:
                logger.error(f"Page {page_num+1} request failed: {e}")
                time.sleep(1)

        return (page_num, None)

    def extract(self, file_path):
        """Extract text from PDF using Groq Vision - pages processed in PARALLEL"""
        from concurrent.futures import ThreadPoolExecutor, as_completed
        try:
            logger.info("Starting Groq Vision extraction (parallel)...")
            start_time = time.time()

            # Convert PDF to images using PyMuPDF
            try:
                images = []
                pdf_document = fitz.open(file_path)
                for page_num in range(len(pdf_document)):
                    page = pdf_document.load_page(page_num)
                    # DPI 150 for faster processing (was 200)
                    pix = page.get_pixmap(dpi=200)
                    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

                    # Resize if image exceeds safe pixel limit for Groq API
                    # Reduced from 25M to 4M to prevent SSL timeouts on large documents
                    MAX_PIXELS = 4_000_000  # ~2000x2000 max resolution
                    if img.width * img.height > MAX_PIXELS:
                        ratio = (MAX_PIXELS / (img.width * img.height)) ** 0.5
                        new_width = int(img.width * ratio)
                        new_height = int(img.height * ratio)
                        logger.info(f"Resizing large image from {img.width}x{img.height} to {new_width}x{new_height}")
                        resample_method = Image.Resampling.LANCZOS if hasattr(Image, 'Resampling') else Image.LANCZOS
                        img = img.resize((new_width, new_height), resample_method)

                    images.append(img)
                pdf_document.close()
            except Exception as e:
                logger.error(f"PDF conversion failed: {e}")
                raise e

            total_pages = len(images)
            logger.info(f"PDF has {total_pages} pages. Processing in parallel...")

            # Process all pages in parallel (max 4 concurrent to respect rate limits)
            results = {}
            max_workers = min(4, total_pages)

            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                futures = {
                    executor.submit(self._process_single_page, i, img, total_pages): i
                    for i, img in enumerate(images)
                }

                for future in as_completed(futures):
                    page_num, content = future.result()
                    if content:
                        results[page_num] = content

            # Reassemble in page order
            full_text = ""
            for i in range(total_pages):
                if i in results:
                    full_text += f"\n\n--- Page {i+1} ---\n\n{results[i]}"

            elapsed = time.time() - start_time
            logger.info(f"Groq Vision extraction completed in {elapsed:.1f}s ({total_pages} pages)")

            if not full_text:
                raise Exception("No text extracted from Groq Vision")

            return full_text

        except Exception as e:
            logger.error(f"Groq Vision extraction failed: {e}")
            raise e

class TextExtractor:
    def __init__(self):
        self.docling_converter = None
        self.groq_extractor = None
        
        # Initialize Groq Vision (Online)
        # Initialize Groq Vision (Online)
        # Prioritize dedicated OCR key, fall back to general chat key
        groq_api_key = os.environ.get('GROQ_OCR_API_KEY') or os.environ.get('GROQ_API_KEY')
        
        if groq_api_key:
            self.groq_extractor = GroqVisionExtractor(groq_api_key)
            logger.info(f"Groq Vision initialized with key starting: {groq_api_key[:8]}...")
        else:
            logger.warning("GROQ_API_KEY or GROQ_OCR_API_KEY not found. Vision extraction disabled.")

        # Initialize Docling (Offline Fallback)
        if DOCLING_AVAILABLE:
            try:
                # Attempt to configure for performance
                try:
                    from docling.datamodel.base_models import InputFormat
                    from docling.document_converter import PdfFormatOption
                    from docling.datamodel.pipeline_options import PdfPipelineOptions, TableFormerMode
                    
                    pipeline_options = PdfPipelineOptions()
                    pipeline_options.do_ocr = True
                    pipeline_options.do_table_structure = True
                    pipeline_options.table_structure_options.mode = TableFormerMode.FAST
                    
                    self.docling_converter = DocumentConverter(
                        format_options={
                            InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
                        }
                    )
                    logger.info("Docling (Offline) initialized successfully")
                except ImportError:
                    logger.info("Optimization modules not found, using default configuration")
                    self.docling_converter = DocumentConverter()
                except Exception as config_error:
                    logger.warning(f"Optimization configuration failed ({config_error}), using default")
                    self.docling_converter = DocumentConverter()

            except Exception as e:
                logger.error(f"Docling initialization failed: {e}")
                self.docling_converter = DocumentConverter() # Minimal fallback

    def extract(self, file_path):
        """Hybrid Extraction: Groq Vision (Online) -> Docling (Offline)"""
        
        # 1. Try Groq Vision if configured and online
        if self.groq_extractor and self.groq_extractor.is_online():
            try:
                logger.info("Online detected. Attempting Groq Vision extraction...")
                return self.groq_extractor.extract(file_path)
            except Exception as e:
                logger.warning(f"Groq Vision failed ({e}). Falling back to local Docling...")
        
        # 2. Fallback to Docling (Local)
        if self.docling_converter:
            try:
                logger.info("Using Local Docling extraction...")
                start_time = datetime.now()
                result = self.docling_converter.convert(file_path)
                markdown_content = result.document.export_to_markdown()
                duration = (datetime.now() - start_time).total_seconds()
                logger.info(f"Docling extraction completed in {duration:.2f}s")
                return markdown_content
            except Exception as e:
                logger.error(f"Docling extraction failed: {e}")
                
        return "Error: All extraction methods failed."

    def clean_text(self, text):
        """Basic text cleaning for the UI/Index"""
        if not text:
            return ""
        
        # Remove null bytes
        text = text.replace('\x00', '')
        
        # Basic whitespace normalization
        text = re.sub(r' +', ' ', text)
        
        return text.strip()


# Initialize extractor
extractor = TextExtractor()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check for text extraction service"""
    return jsonify({
        'status': 'healthy' if DOCLING_AVAILABLE and extractor.docling_converter else 'error',
        'service': 'text_extraction',
        'engine': 'docling',
        'docling_ready': DOCLING_AVAILABLE and extractor.docling_converter is not None,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/extract', methods=['POST'])
def extract_text():
    """Extract text from uploaded document"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        temp_dir = "tmp"
        if not os.path.exists(temp_dir):
            os.makedirs(temp_dir)
            
        filename = file.filename.lower()
        temp_path = os.path.join(temp_dir, filename)
        file.save(temp_path)
        
        try:
            raw_text = extractor.extract(temp_path)
            cleaned_text = extractor.clean_text(raw_text)
            
            return jsonify({
                'text': cleaned_text,
                'filename': filename,
                'word_count': len(cleaned_text.split()),
                'character_count': len(cleaned_text),
                'extraction_success': bool(cleaned_text),
                'timestamp': datetime.now().isoformat()
            })
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)
                
    except Exception as e:
        logger.error(f"Upload-based extraction error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/extract/path', methods=['POST'])
def extract_text_from_path():
    """Extract text from local file path"""
    try:
        data = request.get_json()
        if not data or 'file_path' not in data:
            return jsonify({'error': 'file_path is required'}), 400
        
        file_path = data['file_path']
        if not os.path.exists(file_path):
            return jsonify({'error': 'File not found'}), 404
        
        raw_text = extractor.extract(file_path)
        cleaned_text = extractor.clean_text(raw_text)
        
        return jsonify({
            'text': cleaned_text,
            'file_path': file_path,
            'word_count': len(cleaned_text.split()),
            'character_count': len(cleaned_text),
            'extraction_success': bool(cleaned_text),
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Path-based extraction error: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    logger.info("Starting Modern Text Extraction Service (Docling Engine)...")
    # Using threaded=True as Docling is generally safe to run alongside Flask
    app.run(host='0.0.0.0', port=5002, debug=False, threaded=True)