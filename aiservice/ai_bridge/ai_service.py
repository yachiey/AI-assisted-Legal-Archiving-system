"""
Core AI functionality for document processing - With Groq/Llama fallback
"""
import os
import logging
import requests
import re
from pathlib import Path
from dotenv import load_dotenv

# Load .env file BEFORE reading environment variables
env_path = Path(__file__).parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

from config import (
    LARAVEL_BASE_URL, LARAVEL_API_TIMEOUT,
    MAX_TITLE_LENGTH, MAX_DESCRIPTION_LENGTH,
    MIN_PARAGRAPH_LENGTH, TITLE_SEARCH_LINES, EMBEDDING_MODEL_PATH
)
from model_loader import get_embedding_model, get_llama_model, is_llama_loaded, get_llama_lock

# Configure logging
# logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
# Add file handler for debugging
fh = logging.FileHandler('ai_debug.log')
fh.setLevel(logging.INFO)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
fh.setFormatter(formatter)
logger.addHandler(fh)

# Groq API configuration - loaded AFTER dotenv
GROQ_API_KEY = os.getenv('GROQ_API_KEY')
GROQ_MODEL = os.getenv('GROQ_MODEL', 'llama-3.3-70b-versatile')
GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
AI_SERVICE_TYPE = os.getenv('AI_SERVICE_TYPE', 'groq')  # 'groq' or 'local'

logger.info(f"AI Service initialized - Type: {AI_SERVICE_TYPE}, Groq API Key: {'Found' if GROQ_API_KEY else 'Not found'}")

class ContentAnalyzer:
    """Helper class for document content analysis"""
    
    DOCUMENT_TYPES = {
        'criminal defense practice manual': ['criminal', 'defense', 'practice', 'manual', 'attorney-client'],
        'legal office guide': ['legal office', 'guide', 'reference', 'procedures'],
        'contract agreement': ['agreement', 'parties', 'consideration', 'terms'],
        'litigation document': ['plaintiff', 'defendant', 'court', 'filing'],
        'policy document': ['policy', 'procedure', 'compliance', 'standards']
    }
    
    SUBJECT_PATTERNS = [
        'criminal case management', 'defense practice', 'attorney-client privilege',
        'legal office procedures', 'case preparation', 'client representation',
        'contract law', 'employment law', 'litigation strategy'
    ]
    
    TOPIC_PATTERNS = {
        'attorney-client privilege': r'attorney[- ]client privilege',
        'confidentiality': r'confidential|confidentiality',
        'case preparation': r'case preparation|preparing cases',
        'court procedures': r'court procedures|courtroom',
        'evidence handling': r'evidence|handling evidence'
    }
    
    @staticmethod
    def detect_document_type(text):
        """Detect document type based on content"""
        text_lower = text.lower()
        best_match = 'legal document'
        best_score = 0
        
        for doc_type, keywords in ContentAnalyzer.DOCUMENT_TYPES.items():
            score = sum(1 for keyword in keywords if keyword in text_lower)
            if score > best_score:
                best_score = score
                best_match = doc_type
        
        return best_match
    
    @staticmethod
    def extract_subject_matter(text):
        """Extract main subject from document"""
        text_lower = text.lower()
        for pattern in ContentAnalyzer.SUBJECT_PATTERNS:
            if re.search(pattern, text_lower):
                return pattern
        return None
    
    @staticmethod
    def extract_key_topics(text):
        """Extract key topics from document"""
        text_lower = text.lower()
        found_topics = []
        for topic, pattern in ContentAnalyzer.TOPIC_PATTERNS.items():
            if re.search(pattern, text_lower):
                found_topics.append(topic)
        return found_topics[:3]

class AIBridgeService:
    def __init__(self):
        self.analyzer = ContentAnalyzer()
    
    def call_laravel_api(self, endpoint, method='GET', data=None, headers=None):
        """Make API calls to Laravel backend"""
        try:
            url = f"{LARAVEL_BASE_URL}/api{endpoint}"
            
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=LARAVEL_API_TIMEOUT)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=LARAVEL_API_TIMEOUT)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=LARAVEL_API_TIMEOUT)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            if response.status_code == 302:
                return {'success': False, 'error': 'Authentication required', 'status_code': response.status_code}
            
            response_data = None
            if response.content:
                try:
                    response_data = response.json()
                except ValueError:
                    response_data = {'raw_response': response.text[:200]}
            
            return {
                'success': response.status_code < 400,
                'data': response_data,
                'status_code': response.status_code
            }
        except Exception as e:
            logger.error(f"Laravel API call failed: {str(e)}")
            return {'success': False, 'error': str(e), 'status_code': 500}
    
    def generate_embeddings_with_bert(self, text_chunks):
        """Generate embeddings using BERT model"""
        try:
            embedding_model = get_embedding_model()
            if not embedding_model:
                raise Exception("Embedding model not loaded")
            
            embeddings = []
            for chunk in text_chunks:
                embedding = embedding_model.encode([chunk], convert_to_tensor=False)[0]
                embeddings.append({
                    'chunk_text': chunk,
                    'embedding': embedding.tolist(),
                    'model_used': 'legal-bert-base-uncased'
                })
            
            return embeddings
        except Exception as e:
            logger.error(f"BERT embedding generation failed: {str(e)}")
            return []
    
    def analyze_document_content(self, text):
        """Analyze document content to extract title, description, and generate AI suggestions.
        Runs all 3 Groq calls in PARALLEL for speed."""
        from concurrent.futures import ThreadPoolExecutor, as_completed
        try:
            # Debug logging
            logger.info(f"analyze_document_content called with text length: {len(text) if text else 0}")
            logger.info(f"Text preview (first 300 chars): {text[:300] if text else 'NONE'}")

            # Check if we have sufficient text
            if not text or len(text.strip()) < 50:
                logger.error(f"Insufficient text for analysis. Length: {len(text) if text else 0}")
                return {
                    'suggested_title': 'Legal Document',
                    'suggested_description': 'Insufficient text content extracted from document',
                    'ai_remarks': 'ERROR: No text content available for analysis'
                }

            # Run title, description, and remarks generation IN PARALLEL
            title = 'Legal Document'
            description = 'Unable to generate description'
            remarks = 'Unable to generate remarks'

            with ThreadPoolExecutor(max_workers=3) as executor:
                future_title = executor.submit(self._extract_title, text)
                future_desc = executor.submit(self._generate_description, text)
                future_remarks = executor.submit(self._generate_remarks, text)

                try:
                    title = future_title.result(timeout=60)
                except Exception as e:
                    logger.error(f"Parallel title generation failed: {str(e)}")

                try:
                    description = future_desc.result(timeout=60)
                except Exception as e:
                    logger.error(f"Parallel description generation failed: {str(e)}")

                try:
                    remarks = future_remarks.result(timeout=60)
                except Exception as e:
                    logger.error(f"Parallel remarks generation failed: {str(e)}")

            logger.info(f"All 3 AI tasks completed in parallel")

            return {
                'suggested_title': title,
                'suggested_description': description,
                'ai_remarks': remarks
            }
        except Exception as e:
            logger.error(f"Document content analysis failed: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return {
                'suggested_title': 'Error Logic',
                'suggested_description': f'DEBUG ERROR: {str(e)}',
                'ai_remarks': f'Analysis error: {str(e)}'
            }
    
    def _clean_title_final(self, title):
        """Final cleanup: ensure title name is PascalCase with no spaces/hyphens/periods.
        Handles cases like '2025-10-03-OLIVER D. FUENTEVILLA-Affidavit' -> '2025-10-03-OliverDFuentevilla-Affidavit'
        """
        try:
            # Only process titles that start with a date
            match = re.match(r'^(\d{4}-\d{2}-\d{2})-(.+)-([A-Za-z]+)$', title)
            if not match:
                return title

            date_str = match.group(1)
            name_raw = match.group(2)
            doc_type = match.group(3)

            # Check if name already looks clean (PascalCase, no spaces/periods/hyphens)
            if re.match(r'^[A-Z][a-z]+(?:[A-Z][a-z]*)*$', name_raw):
                return title  # Already clean

            # Clean the name: remove periods, split by spaces/hyphens, PascalCase
            formatted_name = self._format_name_pascal(name_raw)

            cleaned = f"{date_str}-{formatted_name}-{doc_type}"
            logger.info(f"Final title cleanup: '{title}' -> '{cleaned}'")
            return cleaned

        except Exception as e:
            logger.error(f"Final title cleanup failed: {str(e)}")
            return title

    def _extract_title(self, text):
        """Extract document title with automatic Groq/Llama fallback"""
        try:
            # Log debugging info
            logger.info(f"Title generation - Text length: {len(text) if text else 0} chars")
            logger.info(f"Title generation - Service type: {AI_SERVICE_TYPE}")
            logger.info(f"Title generation - Llama available: {is_llama_loaded()}")

            if not text or len(text.strip()) < 100:
                logger.warning("Insufficient text for title generation")
                logger.warning(f"Text preview: {text[:200] if text else 'None'}")
                return "Legal Document"

            title = None

            # Try Groq first (if configured as primary and has API key)
            if AI_SERVICE_TYPE == 'groq' and GROQ_API_KEY:
                try:
                    logger.info("Attempting Groq API for title generation...")
                    title = self._generate_groq_title(text)
                    if title and len(title.strip()) > 5:
                        logger.info(f"Groq generated title: {title}")
                except Exception as e:
                    logger.warning(f"Groq title generation failed: {str(e)}")
                    logger.info("Falling back to local Llama...")

            # Try local Llama (either as primary or fallback from Groq)
            if not title and is_llama_loaded():
                logger.info("Attempting local Llama title generation...")
                title = self._generate_llama_title(text)
                if title and title != "Legal Document" and len(title.strip()) > 5:
                    logger.info(f"Llama generated title: {title}")
                else:
                    logger.warning("Llama generated poor title, falling back to rule-based")
                    title = None

            # Last resort: enhanced rule-based
            if not title:
                logger.info("Using enhanced rule-based title generation")
                title = self._generate_enhanced_title(text)

            # ALWAYS run final cleanup to ensure PascalCase name format
            title = self._clean_title_final(title)
            logger.info(f"Final title returned: {title}")
            return title

        except Exception as e:
            logger.error(f"Title generation failed: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return "Legal Document"
    
    def _normalize_title_format(self, title):
        """Normalize any title to YYYY-MM-DD-FullName-DocumentType format"""
        try:
            from datetime import datetime

            # Common document type keywords for detection
            doc_keywords = [
                'affidavit', 'contract', 'agreement', 'resolution', 'memorandum', 'memo',
                'certificate', 'deed', 'notice', 'complaint', 'motion', 'order',
                'petition', 'warrant', 'subpoena', 'summons', 'brief', 'declaration',
                'stipulation', 'judgment', 'verdict', 'indictment', 'arraignment',
                'service', 'employment', 'lease', 'rental', 'sale',
                'power of attorney', 'last will', 'testament', 'endorsement',
                'waiver', 'release', 'acknowledgment', 'certification', 'permit',
                'license', 'registration', 'incorporation', 'bylaws',
                'undertaking', 'guarantee'
            ]

            # CASE 1: Title already starts with YYYY-MM-DD (AI tried the format but got name wrong)
            # e.g. "2025-10-03-OLIVER-D.-FUENTEVILLA-Affidavit"
            date_prefix_match = re.match(r'^(\d{4}-\d{2}-\d{2})-(.+)$', title)
            if date_prefix_match:
                date_str = date_prefix_match.group(1)
                remainder = date_prefix_match.group(2)  # "OLIVER-D.-FUENTEVILLA-Affidavit"

                # Find the doc type: scan from the END for a known keyword
                # Split remainder by hyphens
                segments = remainder.split('-')
                doc_type_parts = []
                name_parts = []

                # Walk backwards to find where the doc type starts
                found_doc_start = False
                for i in range(len(segments) - 1, -1, -1):
                    seg_lower = segments[i].lower().replace('.', '')
                    if not found_doc_start:
                        # Check if this segment is part of a doc type keyword
                        is_doc = any(seg_lower in kw or kw.startswith(seg_lower) for kw in doc_keywords)
                        # Also check combined with already-found doc parts
                        if doc_type_parts:
                            combined = seg_lower + ''.join(p.lower() for p in reversed(doc_type_parts))
                            is_doc = is_doc or any(combined.replace(' ', '') in kw.replace(' ', '') for kw in doc_keywords)

                        if is_doc:
                            doc_type_parts.insert(0, segments[i])
                        else:
                            found_doc_start = True
                            name_parts.insert(0, segments[i])
                    else:
                        name_parts.insert(0, segments[i])

                # If no name parts found, all non-doc segments are names
                if not name_parts and len(segments) > 1:
                    name_parts = segments[:-1]
                    doc_type_parts = [segments[-1]]

                # Format name: join all name parts, remove periods, PascalCase
                raw_name = ' '.join(name_parts)
                formatted_name = self._format_name_pascal(raw_name)

                # Format doc type
                raw_doc = ''.join(doc_type_parts)
                # Clean and PascalCase
                raw_doc = raw_doc.replace('.', '').strip()
                if raw_doc and raw_doc[0].isupper():
                    formatted_type = raw_doc  # Already PascalCase like "Affidavit"
                else:
                    formatted_type = raw_doc.capitalize() if raw_doc else 'LegalDocument'

                normalized = f"{date_str}-{formatted_name}-{formatted_type}"
                logger.info(f"Normalized title: '{title}' -> '{normalized}'")
                return normalized

            # CASE 2: Title is in a different format (e.g. "Affidavit of Loss - Juan Dela Cruz - Oct 3, 2025")
            # Extract date
            date_str = None
            date_match = re.search(r'(\d{4}-\d{2}-\d{2})', title)
            if date_match:
                date_str = date_match.group(1)
            else:
                month_match = re.search(r'(\w+)\s+(\d{1,2}),?\s+(\d{4})', title)
                if month_match:
                    try:
                        parsed = datetime.strptime(f"{month_match.group(1)} {month_match.group(2)} {month_match.group(3)}", '%B %d %Y')
                        date_str = parsed.strftime('%Y-%m-%d')
                    except ValueError:
                        pass
                if not date_str:
                    slash_match = re.search(r'(\d{1,2})/(\d{1,2})/(\d{4})', title)
                    if slash_match:
                        m, d, y = slash_match.group(1), slash_match.group(2), slash_match.group(3)
                        date_str = f"{y}-{m.zfill(2)}-{d.zfill(2)}"

            if not date_str:
                date_str = datetime.now().strftime('%Y-%m-%d')

            # Remove date from title to isolate name and doc type
            name_part = title
            for pattern in [r'\d{4}-\d{2}-\d{2}', r'\w+\s+\d{1,2},?\s+\d{4}', r'\d{1,2}/\d{1,2}/\d{4}']:
                name_part = re.sub(pattern, '', name_part)

            # Split by common separators (dash, em dash, etc.)
            parts = re.split(r'\s*[-–—]\s*', name_part)
            parts = [p.strip() for p in parts if p.strip()]

            name = ''
            doc_type = ''
            for part in parts:
                part_lower = part.lower()
                is_doc = any(kw in part_lower for kw in doc_keywords)
                if is_doc and not doc_type:
                    doc_type = part
                elif not is_doc and not name and len(part) > 1:
                    name = part

            formatted_name = self._format_name_pascal(name)

            # Format doc type as PascalCase
            if doc_type:
                words = doc_type.split()
                formatted_type = ''.join(w.capitalize() for w in words if w)
            else:
                formatted_type = 'LegalDocument'

            normalized = f"{date_str}-{formatted_name}-{formatted_type}"
            logger.info(f"Normalized title: '{title}' -> '{normalized}'")
            return normalized

        except Exception as e:
            logger.error(f"Title normalization failed: {str(e)}")
            from datetime import datetime
            return f"{datetime.now().strftime('%Y-%m-%d')}-Unknown-LegalDocument"

    def _generate_groq_title(self, text):
        """Generate title using Groq API"""
        try:
            if not GROQ_API_KEY:
                raise Exception("Groq API key not configured")

            text_sample = text[:2000] if len(text) > 2000 else text

            response = requests.post(
                GROQ_API_URL,
                headers={
                    'Authorization': f'Bearer {GROQ_API_KEY}',
                    'Content-Type': 'application/json'
                },
                json={
                    'model': GROQ_MODEL,
                    'messages': [
                        {
                            'role': 'system',
                            'content': 'You are an expert legal document analyst. Extract document metadata and format titles precisely.'
                        },
                        {
                            'role': 'user',
                            'content': f'Read this legal document and create a title in EXACTLY this format:\nYYYY-MM-DD-FullName-DocumentType\n\nSTRICT RULES:\n1. Date must be YYYY-MM-DD format. Use the date found in the document.\n2. FullName must be PascalCase with NO spaces, NO hyphens, NO periods (e.g., "LalaineGSariana" not "LALAINE G. SARIANA").\n3. DocumentType MUST be the FULL SPECIFIC type in PascalCase - NEVER use just "Affidavit", always include the subtype like "AffidavitOfNoViolation", "AffidavitOfLoss".\n4. Use ONLY hyphens (-) to separate the three parts.\n\nExamples of CORRECT titles:\n- 2025-09-02-OliverDFuentevilla-AffidavitOfNoViolation\n- 2024-05-12-JuanDelaCruz-AffidavitOfLoss\n- 2023-11-15-CmuSecurityAgency-ServiceContract\n- 2024-03-20-MariaClara-MemorandumOfAgreement\n\nExamples of WRONG titles:\n- 2024-05-12-JuanDelaCruz-Affidavit (too generic, missing subtype)\n- 2024-05-12-JUAN DELA CRUZ-Affidavit (has spaces, uppercase)\n\nDocument:\n{text_sample}\n\nProvide ONLY the formatted title, nothing else:'
                        }
                    ],
                    'temperature': 0.2,
                    'max_tokens': 60
                },
                timeout=30
            )

            if response.status_code != 200:
                raise Exception(f"Groq API error: {response.status_code} - {response.text}")

            data = response.json()
            title = data['choices'][0]['message']['content'].strip()

            # Clean up
            title = title.replace('"', '').replace("'", '').replace('Title:', '').strip()
            title = ' '.join(title.split())

            # Remove unwanted prefixes
            unwanted_starts = ['this is', 'this document', 'the document', 'document:', 'title:']
            for unwanted in unwanted_starts:
                if title.lower().startswith(unwanted):
                    title = title[len(unwanted):].strip()

            # Check if the AI already returned the correct format (YYYY-MM-DD-Name-Type)
            if re.match(r'^\d{4}-\d{2}-\d{2}-[A-Z][a-zA-Z]+-[A-Z][a-zA-Z]+$', title):
                logger.info(f"Groq returned correctly formatted title: {title}")
                return title

            # Otherwise, normalize it
            return self._normalize_title_format(title)

        except Exception as e:
            logger.error(f"Groq title generation failed: {str(e)}")
            raise

    def _generate_llama_title(self, text):
        """Generate title using Llama model with embeddings content"""
        try:
            llama_model = get_llama_model()
            if not llama_model:
                raise Exception("Llama model not available")

            # Use first 1500 characters to avoid context issues
            text_sample = text[:1500] if len(text) > 1500 else text

            # Prompt requesting the standardized format
            prompt = f"""<|start_header_id|>system<|end_header_id|>

You extract document metadata. Reply with ONLY the title in this exact format: YYYY-MM-DD-FullName-DocumentType
Rules: Date=YYYY-MM-DD, Name=PascalCase no spaces no periods, Type=FULL SPECIFIC type in PascalCase (never just "Affidavit", use "AffidavitOfLoss" etc).
Example: 2025-09-02-OliverDFuentevilla-AffidavitOfNoViolation<|eot_id|><|start_header_id|>user<|end_header_id|>

Extract the date, person name, and FULL SPECIFIC document type. Reply with ONLY the formatted title.

{text_sample}<|eot_id|><|start_header_id|>assistant<|end_header_id|>

"""

            # Use the lock for thread-safe model access
            with get_llama_lock():
                response = llama_model(
                    prompt,
                    max_tokens=40,
                    temperature=0.1,
                    top_p=0.9,
                    repeat_penalty=1.2,
                    stop=["<|eot_id|>", "\n", "<|start_header_id|>"]
                )

            title = response['choices'][0]['text'].strip()

            # Check for chatty responses - if it starts with common prefixes, fall back
            chatty_starts = [
                'here is', 'the title', 'this is', 'i have', 'based on',
                'the document', 'extracted', 'output:', 'answer:'
            ]
            if any(title.lower().startswith(prefix) for prefix in chatty_starts):
                logger.warning(f"Llama gave chatty response: '{title[:50]}', using rule-based")
                return None

            # Detect refusal
            refusal_phrases = ['i cannot', 'i can\'t', 'i will not', 'cannot provide', 'unable to']
            if any(phrase in title.lower() for phrase in refusal_phrases):
                logger.warning(f"Llama refused: {title[:50]}")
                return None

            # Clean up quotes
            title = title.strip('"\'').strip()
            title = ' '.join(title.split())

            # Validate
            if len(title) < 5 or len(title) > MAX_TITLE_LENGTH:
                logger.warning(f"Invalid title length: {len(title)}")
                return None

            logger.info(f"Generated Llama title: '{title}'")

            # Check if already in correct format
            if re.match(r'^\d{4}-\d{2}-\d{2}-[A-Z][a-zA-Z]+-[A-Z][a-zA-Z]+$', title):
                return title

            # Otherwise, normalize it
            return self._normalize_title_format(title)

        except Exception as e:
            logger.error(f"Llama title generation failed: {str(e)}")
            return None
    
    def _extract_name_from_text(self, text):
        """Extract person name from document text using multiple patterns"""
        # Try "I, [Name], of legal age"
        match = re.search(r"I,\s+([A-Z][a-zA-Z\s\.]+?),\s+(?:of\s+legal\s+age|Filipino)", text)
        if match:
            return match.group(1).strip()
        # Try "Name: [Name]"
        match = re.search(r"Name:\s+([A-Z][a-zA-Z\s\.]+)", text)
        if match:
            return match.group(1).strip()
        # Try "AFFIANT" / "undersigned" patterns: "[Name], Filipino"
        match = re.search(r"([A-Z][A-Z\s\.]{3,}),\s*(?:Filipino|of\s+legal\s+age)", text)
        if match:
            return match.group(1).strip()
        # Try "executed by [Name]"
        match = re.search(r"executed\s+by\s+([A-Z][a-zA-Z\s\.]+?)(?:\s*,|\s+on|\s+this)", text, re.IGNORECASE)
        if match:
            return match.group(1).strip()
        # Try all-caps name near beginning (common in legal docs)
        match = re.search(r'\b([A-Z][A-Z]+(?:\s+[A-Z]\.?\s*)?(?:\s+[A-Z][A-Z]+)+)\b', text[:1000])
        if match:
            candidate = match.group(1).strip()
            # Filter out common all-caps phrases that aren't names
            non_names = ['REPUBLIC', 'PHILIPPINES', 'AFFIDAVIT', 'BOARD', 'RESOLUTION', 'CONTRACT', 'AGREEMENT', 'MEMORANDUM', 'PROVINCE', 'CITY', 'MUNICIPALITY', 'BARANGAY']
            if not any(nn in candidate for nn in non_names) and len(candidate.split()) >= 2:
                return candidate
        return None

    def _extract_date_from_text(self, text):
        """Extract date from document text"""
        from datetime import datetime
        # Try "day of Month, Year" pattern
        match = re.search(r'(\d{1,2})(?:st|nd|rd|th)?\s+(?:day\s+of\s+)?(\w+),?\s+(\d{4})', text)
        if match:
            try:
                parsed = datetime.strptime(f"{match.group(1)} {match.group(2)} {match.group(3)}", '%d %B %Y')
                return parsed.strftime('%Y-%m-%d')
            except ValueError:
                pass
        # Try Month DD, YYYY
        match = re.search(r'(\w+)\s+(\d{1,2}),?\s+(\d{4})', text)
        if match:
            try:
                parsed = datetime.strptime(f"{match.group(1)} {match.group(2)} {match.group(3)}", '%B %d %Y')
                return parsed.strftime('%Y-%m-%d')
            except ValueError:
                pass
        # Try YYYY-MM-DD
        match = re.search(r'(\d{4}-\d{2}-\d{2})', text)
        if match:
            return match.group(1)
        # Try MM/DD/YYYY
        match = re.search(r'(\d{1,2})/(\d{1,2})/(\d{4})', text)
        if match:
            return f"{match.group(3)}-{match.group(1).zfill(2)}-{match.group(2).zfill(2)}"
        # Fallback to today
        return datetime.now().strftime('%Y-%m-%d')

    def _format_name_pascal(self, raw_name):
        """Convert any name format to PascalCase with no spaces/hyphens/periods"""
        if not raw_name:
            return 'Unknown'
        cleaned = raw_name.replace('.', '').replace(',', '').replace("'", '').strip()
        words = re.split(r'[\s\-]+', cleaned)
        result = ''.join(word.capitalize() for word in words if word)
        return result if result else 'Unknown'

    def _generate_enhanced_title(self, text):
        """Generate title using enhanced content analysis in YYYY-MM-DD-Name-Type format"""
        try:
            from datetime import datetime

            # Extract date from document
            date_str = self._extract_date_from_text(text)

            # Extract name from document
            raw_name = self._extract_name_from_text(text)
            formatted_name = self._format_name_pascal(raw_name)

            # Check if traditional title extraction found a title line (used as doc type hint)
            traditional_title = self._extract_traditional_title(text)

            # Detect document type from text content
            text_lower = text.lower()
            # Also use traditional title as additional context
            if traditional_title:
                text_lower = traditional_title.lower() + ' ' + text_lower
            doc_type = 'LegalDocument'

            if 'affidavit' in text_lower:
                if 'no violation' in text_lower:
                    doc_type = 'AffidavitOfNoViolation'
                elif 'compliance' in text_lower:
                    doc_type = 'AffidavitOfCompliance'
                elif 'loss' in text_lower:
                    doc_type = 'AffidavitOfLoss'
                elif 'desistance' in text_lower:
                    doc_type = 'AffidavitOfDesistance'
                elif 'support' in text_lower:
                    doc_type = 'AffidavitOfSupport'
                elif 'guardianship' in text_lower:
                    doc_type = 'AffidavitOfGuardianship'
                elif 'undertaking' in text_lower:
                    doc_type = 'AffidavitOfUndertaking'
                elif 'two disinterested' in text_lower or 'disinterested person' in text_lower:
                    doc_type = 'AffidavitOfTwoDisinterestedPersons'
                elif 'discrepancy' in text_lower:
                    doc_type = 'AffidavitOfDiscrepancy'
                elif 'no income' in text_lower or 'no employment' in text_lower:
                    doc_type = 'AffidavitOfNoIncome'
                elif 'self-adjudication' in text_lower or 'adjudication' in text_lower:
                    doc_type = 'AffidavitOfSelfAdjudication'
                else:
                    doc_type = 'Affidavit'
            elif 'contract' in text_lower and 'agreement' in text_lower:
                doc_type = 'ContractAgreement'
            elif 'resolution' in text_lower and 'board' in text_lower:
                doc_type = 'BoardResolution'
            elif 'memorandum' in text_lower or 'memo' in text_lower:
                doc_type = 'Memorandum'
            elif 'deed' in text_lower and 'sale' in text_lower:
                doc_type = 'DeedOfSale'
            elif 'certificate' in text_lower:
                doc_type = 'Certificate'
            elif 'power of attorney' in text_lower:
                doc_type = 'PowerOfAttorney'
            elif 'criminal' in text_lower and 'case' in text_lower:
                doc_type = 'CriminalCase'
            elif 'policy' in text_lower and 'procedure' in text_lower:
                doc_type = 'PolicyProcedures'
            elif 'petition' in text_lower:
                doc_type = 'Petition'
            elif 'complaint' in text_lower:
                doc_type = 'Complaint'
            elif 'notice' in text_lower:
                doc_type = 'Notice'
            elif 'waiver' in text_lower:
                doc_type = 'Waiver'

            title = f"{date_str}-{formatted_name}-{doc_type}"

            logger.info(f"Generated enhanced title: '{title}'")
            return title

        except Exception as e:
            logger.error(f"Enhanced title generation failed: {str(e)}")
            from datetime import datetime
            return f"{datetime.now().strftime('%Y-%m-%d')}-Unknown-LegalDocument"

    def _extract_traditional_title(self, text):
        """Extract raw title line from document text (not formatted)"""
        lines = [line.strip() for line in text.split('\n') if line.strip()]

        for line in lines[:TITLE_SEARCH_LINES]:
            if 10 < len(line) < 100:
                clean_line = line.replace("TITLE:", "").replace("Subject:", "").strip()
                if clean_line and not clean_line.lower().startswith(('page', 'date', 'from:', 'to:')):
                    return clean_line[:MAX_TITLE_LENGTH]

        return None
    
    def _generate_description(self, text):
        """Generate intelligent description with automatic Groq/Llama fallback"""
        try:
            # Try Groq first (if configured as primary and has API key)
            if AI_SERVICE_TYPE == 'groq' and GROQ_API_KEY:
                try:
                    logger.info("Attempting Groq API for description generation...")
                    description = self._generate_groq_description(text)
                    if description and len(description.strip()) > 20:
                        logger.info("Groq generated description successfully")
                        return description
                except Exception as e:
                    logger.warning(f"Groq description generation failed: {str(e)}")
                    logger.info("Falling back to local Llama...")

            # Try local Llama (either as primary or fallback from Groq)
            if is_llama_loaded():
                logger.info("Attempting local Llama description generation...")
                description = self._generate_llama_description(text)
                if description and len(description.strip()) > 20:
                    return description

            # Only try Groq as fallback if NOT in local-only mode
            # When AI_SERVICE_TYPE is 'local', we stay offline - no Groq fallback
            # if AI_SERVICE_TYPE != 'groq' and GROQ_API_KEY:
            #     try:
            #         logger.info("Llama failed, trying Groq as fallback...")
            #         description = self._generate_groq_description(text)
            #         if description and len(description.strip()) > 20:
            #             return description
            #     except Exception as e:
            #         logger.warning(f"Groq fallback failed: {str(e)}")

            # Last resort: rule-based
            return self._generate_rule_based_description(text)

        except Exception as e:
            logger.error(f"Description generation failed: {str(e)}")
            return f"Legal document containing {len(text.split())} words available for review and processing."
    
    def _generate_groq_description(self, text):
        """Generate description using Groq API"""
        try:
            if not GROQ_API_KEY:
                raise Exception("Groq API key not configured")

            text_sample = text[:1500] if len(text) > 1500 else text

            response = requests.post(
                GROQ_API_URL,
                headers={
                    'Authorization': f'Bearer {GROQ_API_KEY}',
                    'Content-Type': 'application/json'
                },
                json={
                    'model': GROQ_MODEL,
                    'messages': [
                        {
                            'role': 'system',
                            'content': 'You are an expert legal document analyst. Write detailed, specific document summaries that highlight unique information.'
                        },
                        {
                            'role': 'user',
                            'content': f'Read this legal document and write a 2-3 sentence summary (under 400 characters).\n\nYour summary MUST follow this EXACT structure:\n"[Document Type] filed by [FULL NAME OF PERSON], a resident of [ADDRESS/LOCATION], regarding [PURPOSE]. [Date or other details]."\n\nRULES:\n- The FIRST sentence MUST contain the person\'s FULL NAME. If you skip the name, your summary is WRONG.\n- Include their address/location if mentioned.\n- Include the specific purpose.\n\nExample: "Affidavit of Loss filed by Juan Dela Cruz, a resident of Valencia City, Bukidnon, regarding a lost BPI ATM Card. The incident occurred on May 12, 2024."\n\nDocument:\n{text_sample}\n\nSummary:'
                        }
                    ],
                    'temperature': 0.4,
                    'max_tokens': 180
                },
                timeout=30
            )

            if response.status_code != 200:
                raise Exception(f"Groq API error: {response.status_code} - {response.text}")

            data = response.json()
            description = data['choices'][0]['message']['content'].strip().replace('\n', ' ')

            if len(description) > MAX_DESCRIPTION_LENGTH:
                cutoff = description[:MAX_DESCRIPTION_LENGTH].rfind(' ')
                description = description[:cutoff] + "..."

            return description

        except Exception as e:
            logger.error(f"Groq description generation failed: {str(e)}")
            raise

    def _generate_llama_description(self, text):
        """Generate description using Llama model"""
        try:
            llama_model = get_llama_model()
            if not llama_model:
                raise Exception("Llama model not available")

            text_sample = text[:1500] if len(text) > 1500 else text

            # Detailed prompt matching Groq's format for consistent output
            prompt = f"""<|start_header_id|>system<|end_header_id|>

You are an expert legal document analyst. Write detailed, specific document summaries that highlight unique information.<|eot_id|><|start_header_id|>user<|end_header_id|>

Read this legal document and write a 2-3 sentence summary (under 400 characters).

Your summary MUST follow this EXACT structure:
"[Document Type] filed by [FULL NAME OF PERSON], a resident of [ADDRESS/LOCATION], regarding [PURPOSE]. [Date or other details]."

RULES:
- The FIRST sentence MUST contain the person's FULL NAME. If you skip the name, your summary is WRONG.
- Include their address/location if mentioned.
- Include the specific purpose.

Example: "Affidavit of Loss filed by Juan Dela Cruz, a resident of Valencia City, Bukidnon, regarding a lost BPI ATM Card. The incident occurred on May 12, 2024."

Document:
{text_sample}

Summary:<|eot_id|><|start_header_id|>assistant<|end_header_id|>

"""

            # Use the lock for thread-safe model access
            with get_llama_lock():
                response = llama_model(
                    prompt,
                    max_tokens=180,
                    temperature=0.4,
                    top_p=0.9,
                    repeat_penalty=1.1,
                    stop=["<|eot_id|>", "<|start_header_id|>"]
                )
            description = response['choices'][0]['text'].strip().replace('\n', ' ')

            # Clean up common AI response prefixes
            unwanted_prefixes = [
                'here is a 2-3 sentence summary of the document:',
                'here is a 2-3 sentence summary:',
                'here is a specific summary:',
                'here is a summary:',
                'here is the summary:',
                'here\'s a summary:',
                'here\'s the summary:',
                'summary:',
                'this document is',
                'the document is',
                'facts:',
                'here are the facts:',
                'here are the key facts:',
                'here is the specific summary:',
            ]
            description_lower = description.lower()
            for prefix in unwanted_prefixes:
                if description_lower.startswith(prefix):
                    description = description[len(prefix):].strip()
                    if description:
                        description = description[0].upper() + description[1:]
                    break

            # Detect if Llama refused to process (safety rejection)
            refusal_phrases = ['i cannot', 'i can\'t', 'i will not', 'i won\'t', 'cannot provide',
                             'unable to', 'not appropriate', 'cannot assist', 'i apologize']
            if any(phrase in description.lower() for phrase in refusal_phrases):
                logger.warning(f"Llama refused to generate description (safety): {description[:100]}")
                raise Exception("Llama safety refusal - falling back to rule-based")

            if len(description) > MAX_DESCRIPTION_LENGTH:
                cutoff = description[:MAX_DESCRIPTION_LENGTH].rfind(' ')
                description = description[:cutoff] + "..."

            if len(description.strip()) < 20:
                raise Exception("Generated description too short")
            
            return description
            
        except Exception as e:
            logger.error(f"Llama description generation failed: {str(e)}")
            return self._generate_rule_based_description(text)
    
    def _suggest_folder_with_llama(self, text, folder_names):
        """Use Llama to suggest folder from available folders (same as Groq)"""
        try:
            if not folder_names or len(folder_names) == 0:
                logger.warning("No folders available for suggestion")
                return None

            llama_model = get_llama_model()
            if not llama_model:
                logger.warning("Llama not available, using keyword matching")
                # Fallback to keyword matching
                for folder_name in folder_names:
                    if folder_name.lower() in text.lower():
                        return folder_name
                return None

            text_sample = text[:1500] if len(text) > 1500 else text
            folders_list = ', '.join(folder_names)

            prompt = f"""<|start_header_id|>system<|end_header_id|>

You are a legal document filing assistant. Match documents to the MOST APPROPRIATE folder based on document TYPE and CONTENT, not just keyword matches.

IMPORTANT RULES:
- Certificate of Employment → HR/Employment related folder, NOT Student Records
- Affidavits → Legal/Affidavit folders
- Contracts/Agreements → Contract/MOA folders
- Court cases → Criminal/Civil folders
- Student documents → Student Records (ONLY for transcripts, enrollment, grades)

Reply with ONLY the exact folder name from the list.<|eot_id|><|start_header_id|>user<|end_header_id|>

Available folders: {folders_list}

Document content:
{text_sample}

Best matching folder:<|eot_id|><|start_header_id|>assistant<|end_header_id|>

"""

            # Use the lock for thread-safe model access
            with get_llama_lock():
                response = llama_model(
                    prompt,
                    max_tokens=50,
                    temperature=0.1, # Lower temperature for more deterministic output
                    top_p=0.9,
                    stop=["<|eot_id|>", "\n", "<|start_header_id|>"]
                )

            raw_response = response['choices'][0]['text'].strip()
            logger.info(f"Llama raw folder response: '{raw_response}'")

            # Clean up response
            suggested_folder = raw_response.replace('"', '').replace("'", '').strip()

            # 1. Exact match check
            if suggested_folder in folder_names:
                logger.info(f"Llama suggested folder (Exact): {suggested_folder}")
                return suggested_folder
            
            # 2. Case-insensitive match
            for folder_name in folder_names:
                if folder_name.lower() == suggested_folder.lower():
                     logger.info(f"Llama suggested folder (Case-insensitive): {folder_name}")
                     return folder_name

            # 3. Contains match (The Fix for "I will choose...")
            # Check if any folder name is contained WITHIN the response
            best_match = None
            longest_match_len = 0
            
            response_lower = suggested_folder.lower()
            for folder_name in folder_names:
                if folder_name.lower() in response_lower:
                    if len(folder_name) > longest_match_len:
                        best_match = folder_name
                        longest_match_len = len(folder_name)
            
            if best_match:
                logger.info(f"Llama suggested folder (Contains Match): {best_match} from '{suggested_folder}'")
                return best_match

            # 4. Keyword fallback (if Llama failed completely)
            logger.warning(f"Llama suggested invalid folder: {suggested_folder}. Trying generic keyword matching.")
            for folder_name in folder_names:
                if folder_name.lower() in text.lower():
                    return folder_name
                    
            return None

        except Exception as e:
            logger.error(f"Llama folder suggestion failed: {str(e)}")
            return None

    def _generate_rule_based_description(self, text):
        """Generate description using content analysis"""
        try:
            word_count = len(text.split())
            text_lower = text.lower()

            doc_type = self.analyzer.detect_document_type(text)
            subject_matter = self.analyzer.extract_subject_matter(text)
            key_topics = self.analyzer.extract_key_topics(text)

            # Build description
            description = f"This is a {doc_type}"

            if subject_matter:
                description += f" focusing on {subject_matter}"
            
            if key_topics:
                topics_str = ", ".join(key_topics)
                description += f", covering topics such as {topics_str}"
            
            description += f". This document contains {word_count:,} words"
            
            if 'attorney-client privilege' in text_lower or 'confidential' in text_lower:
                description += " with confidentiality requirements"
            
            description += "."
            
            # Ensure proper length
            if len(description) > MAX_DESCRIPTION_LENGTH:
                cutoff = description[:MAX_DESCRIPTION_LENGTH].rfind(' ')
                description = description[:cutoff] + "..."
            
            return description
            
        except Exception as e:
            logger.error(f"Rule-based description generation failed: {str(e)}")
            return f"Legal document containing {len(text.split())} words available for review and processing."
    
    def _generate_remarks(self, text):
        """Generate AI remarks about the document with automatic Groq/Llama fallback"""
        try:
            # Try Groq first (if configured as primary and has API key)
            if AI_SERVICE_TYPE == 'groq' and GROQ_API_KEY:
                try:
                    logger.info("Attempting Groq API for remarks generation...")
                    remarks = self._generate_groq_remarks(text)
                    if remarks and len(remarks.strip()) > 20:
                        return remarks
                except Exception as e:
                    logger.warning(f"Groq remarks generation failed: {str(e)}")

            # Try local Llama 
            if is_llama_loaded():
                logger.info("Attempting local Llama remarks generation...")
                remarks = self._generate_llama_remarks(text)
                if remarks and len(remarks.strip()) > 20:
                    return remarks

            # Fallback to rule-based
            return self._generate_rule_based_remarks(text)

        except Exception as e:
            logger.error(f"Remarks generation failed: {str(e)}")
            return self._generate_rule_based_remarks(text)

    def _generate_groq_remarks(self, text):
        """Generate remarks using Groq API"""
        try:
            if not GROQ_API_KEY:
                raise Exception("Groq API key not configured")

            text_sample = text[:2000] if len(text) > 2000 else text

            response = requests.post(
                GROQ_API_URL,
                headers={
                    'Authorization': f'Bearer {GROQ_API_KEY}',
                    'Content-Type': 'application/json'
                },
                json={
                    'model': GROQ_MODEL,
                    'messages': [
                        {
                            'role': 'system',
                            'content': 'You are an expert legal document analyst. Extract key specific details such as penalties, dates, and obligations.'
                        },
                        {
                            'role': 'user',
                            'content': f'Analyze this legal document and provide a concise list of key REMARKS. Focus on:\n1. Specific penalties for non-compliance (if any).\n2. Critical deadlines or dates.\n3. Key obligations or requirements.\n4. Names of main parties.\n\nKeep it under 300 characters. Format as a running paragraph or comma-separated points.\n\nDocument:\n{text_sample}\n\nRemarks:'
                        }
                    ],
                    'temperature': 0.3,
                    'max_tokens': 150
                },
                timeout=30
            )

            if response.status_code != 200:
                raise Exception(f"Groq API error: {response.status_code}")

            data = response.json()
            return data['choices'][0]['message']['content'].strip()
        except Exception as e:
            logger.error(f"Groq remarks generation failed: {str(e)}")
            raise

    def _generate_llama_remarks(self, text):
        """Generate remarks using Llama model"""
        try:
            llama_model = get_llama_model()
            if not llama_model:
                raise Exception("Llama model not available")

            text_sample = text[:2000] if len(text) > 2000 else text

            # Pure extraction prompt
            prompt = f"""<|start_header_id|>system<|end_header_id|>

Extract key details from text.<|eot_id|><|start_header_id|>user<|end_header_id|>

Extract from this text: important dates, deadlines, names, amounts (under 300 chars):

Text: {text_sample}

Details:<|eot_id|><|start_header_id|>assistant<|end_header_id|>

"""

            # Use the lock for thread-safe model access
            with get_llama_lock():
                response = llama_model(
                    prompt,
                    max_tokens=150,
                    temperature=0.3,
                    top_p=0.9,
                    stop=["<|eot_id|>", "<|start_header_id|>"]
                )

            remarks = response['choices'][0]['text'].strip()
            
            return remarks
        except Exception as e:
            logger.error(f"Llama remarks generation failed: {str(e)}")
            return None

    def _generate_rule_based_remarks(self, text):
        """Generate basic rule-based remarks (fallback)"""
        try:
            word_count = len(text.split())
            doc_type = self.analyzer.detect_document_type(text)
            
            remarks = f"AI Analysis: Document classified as {doc_type.replace('_', ' ')}. "
            remarks += f"Contains {word_count} words. "
            
            if word_count > 1000:
                remarks += "High confidence in classification due to substantial content. "
            else:
                remarks += "Limited content for detailed analysis. "
            
            return remarks
        except Exception as e:
            return f"AI analysis completed with basic metrics. Error: {str(e)}"
    
    def suggest_category_and_folder(self, text, categories, folders):
        """
        Suggest category and folder based on document content.
        
        Strategy:
        1. Use Llama AI for intelligent folder suggestion (primary)
        2. Fall back to keyword scoring only if AI returns no match
        3. Category uses keyword scoring (unchanged)
        """
        try:
            text_lower = text.lower()
            folder_names = [f.get('folder_name') for f in folders if isinstance(f, dict) and 'folder_name' in f]
            
            logger.info(f"Folder suggestion - Available folders: {folder_names}")

            # ========================================
            # STEP 1: Category Suggestion (Keyword-based)
            # ========================================
            suggested_category = self._suggest_category_by_keywords(text_lower, categories)
            category_confidence = 0
            if suggested_category:
                logger.info(f"Category suggested: {suggested_category.get('category_name')}")

            # ========================================
            # STEP 2: Folder Suggestion (AI-First Strategy)
            # ========================================
            suggested_folder = None
            folder_confidence = 0
            
            # Try AI (Llama) first - this is the intelligent approach
            ai_suggested_name = self._suggest_folder_with_llama(text, folder_names)
            
            if ai_suggested_name:
                # Find the folder object by name
                for folder in folders:
                    if isinstance(folder, dict) and folder.get('folder_name') == ai_suggested_name:
                        suggested_folder = folder
                        folder_confidence = 10  # High confidence for AI match
                        logger.info(f"✓ AI suggested folder: '{ai_suggested_name}'")
                        break
            
            # Fallback: Keyword scoring ONLY if AI returned nothing
            if not suggested_folder:
                logger.info("AI returned no folder match, trying keyword fallback...")
                suggested_folder, folder_confidence = self._suggest_folder_by_keywords(
                    text_lower, folders, suggested_category
                )
                if suggested_folder:
                    logger.info(f"✓ Keyword fallback folder: '{suggested_folder.get('folder_name')}'")
                else:
                    logger.warning("No folder match found by any method")

            return {
                'suggested_category': suggested_category,
                'suggested_folder': suggested_folder,
                'category_confidence': category_confidence,
                'folder_confidence': folder_confidence
            }

        except Exception as e:
            logger.error(f"Category/folder suggestion failed: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return {
                'suggested_category': None,
                'suggested_folder': None,
                'category_confidence': 0,
                'folder_confidence': 0
            }

    def _suggest_category_by_keywords(self, text_lower, categories):
        """Suggest category based on keyword matching."""
        category_scores = {}
        
        legal_keywords = {
            'contract': ['agreement', 'contract', 'terms'],
            'litigation': ['court', 'case', 'plaintiff', 'defendant'],
            'criminal': ['criminal', 'defense', 'case']
        }

        for category in categories:
            if not isinstance(category, dict) or 'category_name' not in category:
                continue

            score = 0
            category_name_lower = category['category_name'].lower()

            if category_name_lower in text_lower:
                score += 10

            for legal_type, keywords in legal_keywords.items():
                if legal_type in category_name_lower:
                    score += sum(2 for keyword in keywords if keyword in text_lower)

            if score > 0:
                category_scores[category['category_id']] = {'category': category, 'score': score}

        if category_scores:
            best = max(category_scores.values(), key=lambda x: x['score'])
            return best['category']
        
        return None

    def _suggest_folder_by_keywords(self, text_lower, folders, suggested_category):
        """
        Fallback folder suggestion using keyword matching.
        Only called when AI suggestion fails.
        """
        folder_scores = {}

        for folder in folders:
            if not isinstance(folder, dict) or 'folder_name' not in folder:
                continue

            score = 0
            folder_name_lower = folder['folder_name'].lower()

            # Check if folder name appears in document text
            if folder_name_lower in text_lower:
                score += 5

            # Boost if folder matches suggested category
            if suggested_category and folder.get('category_id') == suggested_category.get('category_id'):
                score += 8

            if score > 0:
                folder_scores[folder['folder_id']] = {'folder': folder, 'score': score}

        if folder_scores:
            best = max(folder_scores.values(), key=lambda x: x['score'])
            return best['folder'], best['score']
        
        return None, 0