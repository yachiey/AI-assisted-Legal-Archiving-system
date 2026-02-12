"""
Llama text generation functionality
"""
import logging
import threading
import traceback
from datetime import datetime
try:
    from .config import MAX_TOKENS, TEMPERATURE, TOP_P, RECENT_HISTORY_LIMIT, GENERATION_TIMEOUT
    from .model_manager import model_manager
    from .conversation import conversation_manager
except ImportError:
    from config import MAX_TOKENS, TEMPERATURE, TOP_P, RECENT_HISTORY_LIMIT, GENERATION_TIMEOUT
    from model_manager import model_manager
    from conversation import conversation_manager

logger = logging.getLogger(__name__)

class LlamaGenerator:
    def __init__(self):
        pass

    def _build_system_message(self, document_context=None):
        """Build system message matching the Groq prompt from GroqService.php"""
        base_message = (
            "You are a helpful AI assistant for a legal document management system. "
            "You provide clear, accurate, and professional responses."
        )

        if not document_context or not document_context.strip():
            return base_message

        instructions = (
            "\n\nCRITICAL INSTRUCTIONS - YOU MUST FOLLOW THESE EXACTLY:\n"
            "- Answer based ONLY on the data provided in the context below\n"
            "- NEVER INVENT or MAKE UP information that is not in the context\n"
            "- NEVER create fake subfolders, documents, or hierarchies\n"
            "- If context shows a FOLDER LIST, output ONLY the exact folders shown - do NOT suggest or create new subfolders\n"
            "- Quote specific text from the documents when available\n"
            "- State ONLY document titles when discussing documents\n"
            "- If asked 'what folder?', respond ONLY with the folder name from 'Folder:' field\n"
            "- NEVER create multi-level folder paths that don't exist\n"
            "- NEVER use phrases like 'you could organize' or 'a possible hierarchy'\n"
            "- NEVER mention folders unless explicitly asked\n"
            "- When the context shows '=== FOLDER LIST ===' or '=== FOLDER SUMMARY ===' you MUST respond with ONLY the exact data shown\n"
            "- When user says 'open', 'view', or 'display' a document, respond with: "
            "'To view the document, click the eye button on the document reference card above.' DO NOT simulate a document viewer.\n"
            "- Correct obvious OCR errors (e.g., 'IOLIVER' -> 'OLIVER') silently - just output the clean name\n"
            "- Do NOT quote duplicate or messy text verbatim\n"
            "- FORBIDDEN: Creating suggestions, recommendations, or 'possible' structures that don't exist in the database\n"
            "\nRESPONSE FORMATTING RULES:\n"
            "- CHECK FOR DUPLICATES: Treat documents with the same person's name and same subject "
            "(e.g., 'Affidavit of No Violation') as ONE record, even if filenames differ.\n"
            "- DO NOT repeat document lists if they refer to the same person and same subject.\n"
            "- ANSWER ONLY what is asked in 1-2 sentences. Be extremely concise.\n"
            "- If multiple documents refer to the SAME person, state: "
            "'Found multiple documents for [Name] relating to [Subject].' and stop. "
            "Do not list them individually unless contents differ significantly.\n"
            "- ONLY say there are 'multiple people' if the names actually differ.\n"
            "- Distinguish between 'Identity Count' (people) and 'Document Count' (files).\n"
            "- Use neutral, factual language.\n"
            "- When context contains '=== DOCUMENT ANALYTICS REPORT ===', present it as a "
            "structured analytics report using the EXACT format provided.\n"
            "- Do NOT list individual document titles or filenames in analytics reports "
            "unless the user explicitly asks for them.\n"
            "- All time-based analytics use the document's upload date (created_at timestamp) as the date source.\n"
            "- Deduplicate records: same person + same document type + same created_at date = 1 record.\n"
            "- Keep analytics summaries data-driven, structured, and concise.\n"
            "- If the analytics report says 'No records found', state that clearly without inventing data."
        )

        return f"{base_message}\n\n{document_context.strip()}{instructions}"

    def format_llama_prompt(self, message, history=None, document_context=None):
        """Format prompt for Llama 3.2 Instruct format"""
        system_message = self._build_system_message(document_context)

        if history and len(history) > 0:
            # Build conversation context
            conversation = f"<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n{system_message}<|eot_id|>"

            # Add recent history (last 6 messages for context)
            recent_history = history[-RECENT_HISTORY_LIMIT:] if len(history) > RECENT_HISTORY_LIMIT else history

            for msg in recent_history:
                if msg['role'] == 'user':
                    conversation += f"<|start_header_id|>user<|end_header_id|>\n\n{msg['content']}<|eot_id|>"
                elif msg['role'] == 'assistant':
                    conversation += f"<|start_header_id|>assistant<|end_header_id|>\n\n{msg['content']}<|eot_id|>"

            # Add current message
            conversation += f"<|start_header_id|>user<|end_header_id|>\n\n{message}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n"
        else:
            # First message in conversation
            conversation = f"<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n{system_message}<|eot_id|><|start_header_id|>user<|end_header_id|>\n\n{message}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n"

        return conversation

    def generate_response_internal(self, prompt, conversation_id=None, document_context=None):
        """Internal response generation for Llama"""
        try:
            # Get conversation history
            history = conversation_manager.get_history(conversation_id)

            # Format prompt for Llama
            formatted_prompt = self.format_llama_prompt(prompt, history, document_context)

            logger.info(f"Generating response for conversation {conversation_id}")
            logger.info(f"Prompt length: {len(formatted_prompt)} characters")

            # Get the model
            model = model_manager.get_model()
            if not model:
                raise Exception("Model not loaded")

            # Generate response
            response = model(
                formatted_prompt,
                max_tokens=MAX_TOKENS,
                temperature=TEMPERATURE,
                top_p=TOP_P,
                stop=["<|eot_id|>", "<|end_of_text|>"],
                echo=False
            )

            # Extract generated text
            generated_text = response['choices'][0]['text'].strip()

            # Clean up response
            if not generated_text:
                generated_text = "I'm sorry, I couldn't generate a proper response. Could you rephrase your question?"

            # Remove any remaining special tokens
            for token in ["<|eot_id|>", "<|end_of_text|>", "<|start_header_id|>", "<|end_header_id|>"]:
                generated_text = generated_text.replace(token, "")

            generated_text = generated_text.strip()

            # Store in conversation history
            if conversation_id:
                conversation_manager.add_message(conversation_id, 'user', prompt)
                conversation_manager.add_message(conversation_id, 'assistant', generated_text)

            return generated_text

        except Exception as e:
            logger.error(f"Error in response generation: {str(e)}")
            logger.error(traceback.format_exc())
            raise e

    def generate_response_with_timeout(self, prompt, conversation_id=None, document_context=None, timeout=GENERATION_TIMEOUT):
        """Generate AI response with timeout"""
        result = {}
        exception = {}

        def target():
            try:
                result['response'] = self.generate_response_internal(prompt, conversation_id, document_context)
            except Exception as e:
                exception['error'] = str(e)

        thread = threading.Thread(target=target)
        thread.daemon = True
        thread.start()
        thread.join(timeout)

        if thread.is_alive():
            logger.warning(f"Generation timed out after {timeout}s for conversation {conversation_id}")
            return "I apologize, but I'm taking too long to respond. Please try with a shorter message or try again later."

        if 'error' in exception:
            raise Exception(exception['error'])

        return result.get('response', "No response generated")

# Global generator instance
llama_generator = LlamaGenerator()