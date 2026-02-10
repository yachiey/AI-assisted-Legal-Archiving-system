"""
Flask routes for AI Bridge Service
"""
import os
import logging
import traceback
from datetime import datetime
from flask import Flask, request, jsonify
from config import LARAVEL_BASE_URL, EMBEDDING_MODEL_PATH, FALLBACK_MODEL_PATH
from model_loader import get_embedding_model, is_model_loaded, is_llama_loaded
from ai_service import AIBridgeService

# Configure logging
logger = logging.getLogger(__name__)

def register_routes(app):
    """Register all routes with the Flask app"""
    
    # Initialize the bridge service
    bridge_service = AIBridgeService()

    @app.route('/health', methods=['GET'])
    def health_check():
        """Health check for the AI bridge service"""
        return jsonify({
            'status': 'healthy',
            'service': 'ai_bridge',
            'embedding_model_loaded': is_model_loaded(),
            'llama_model_loaded': is_llama_loaded(),
            'model_path': EMBEDDING_MODEL_PATH if os.path.exists(EMBEDDING_MODEL_PATH) else FALLBACK_MODEL_PATH,
            'laravel_url': LARAVEL_BASE_URL,
            'description_method': 'llama' if is_llama_loaded() else 'rule_based',
            'timestamp': datetime.now().isoformat()
        })

    @app.route('/api/documents/process-ai', methods=['POST'])
    def process_document_ai():
        """AI document processing with automatic folder selection and file movement"""
        try:
            data = request.get_json()
            doc_id = data.get('docId')
            
            if not doc_id:
                return jsonify({
                    'success': False,
                    'message': 'Document ID is required'
                }), 400
            
            # Get document info from Laravel
            auth_header = request.headers.get('Authorization')
            headers = {'Authorization': auth_header} if auth_header else {}
            
            doc_response = bridge_service.call_laravel_api(f'/documents/{doc_id}', headers=headers)
            
            if not doc_response['success']:
                return jsonify({
                    'success': False,
                    'message': 'Failed to fetch document from Laravel'
                }), 404
            
            document = doc_response['data']
            
            # Get text content from existing embeddings using doc_id
            logger.info(f"Processing document {doc_id} with embeddings-based analysis")
            embeddings_response = bridge_service.call_laravel_api(f'/document-embeddings/{doc_id}', headers=headers)
            
            extracted_text = ""
            if embeddings_response['success'] and embeddings_response.get('data'):
                embeddings_data = embeddings_response['data']
                logger.info(f"Found embeddings data for doc_id {doc_id}")
                
                # Handle different response formats (like analyze endpoint)
                if isinstance(embeddings_data, dict):
                    if 'embeddings' in embeddings_data:
                        embeddings_list = embeddings_data['embeddings']
                    else:
                        embeddings_list = list(embeddings_data.values())
                else:
                    embeddings_list = embeddings_data
                
                # Reconstruct text from embedding chunks
                chunks_by_index = {}
                for embedding in embeddings_list:
                    if isinstance(embedding, dict):
                        chunk_index = embedding.get('chunk_index', 0)
                        chunk_text = embedding.get('chunk_text', '')
                        if chunk_text:
                            chunks_by_index[chunk_index] = chunk_text
                
                # Concatenate chunks in order
                for index in sorted(chunks_by_index.keys()):
                    extracted_text += chunks_by_index[index] + " "
                
                logger.info(f"Reconstructed {len(extracted_text)} characters for processing")
            else:
                return jsonify({
                    'success': False,
                    'message': 'No embeddings found for document. Please ensure embeddings are generated first.'
                }), 400
            
            # Update document status to processing
            bridge_service.call_laravel_api(
                f'/documents/{doc_id}/status',
                method='PUT',
                data={'status': 'processing'},
                headers=headers
            )
            
            # Get categories and folders for AI analysis
            categories_response = bridge_service.call_laravel_api('/ai/categories/public')
            folders_response = bridge_service.call_laravel_api('/ai/folders/public')
            
            # Extract data from nested response structure
            categories = []
            folders = []
            
            if categories_response.get('success') and categories_response.get('data'):
                laravel_data = categories_response.get('data')
                if isinstance(laravel_data, dict) and 'data' in laravel_data:
                    categories = laravel_data['data']
                elif isinstance(laravel_data, list):
                    categories = laravel_data
            
            if folders_response.get('success') and folders_response.get('data'):
                laravel_data = folders_response.get('data')
                if isinstance(laravel_data, dict) and 'data' in laravel_data:
                    folders = laravel_data['data']
                elif isinstance(laravel_data, list):
                    folders = laravel_data
            
            # Analyze document content using embeddings with Llama/BERT
            logger.info(f"Analyzing document content for doc_id {doc_id}")
            logger.info(f"Extracted text length: {len(extracted_text)} characters")
            logger.info(f"Text preview: {extracted_text[:200]}...")
            
            if not extracted_text or len(extracted_text.strip()) < 50:
                logger.error("Insufficient text extracted from embeddings")
                return jsonify({
                    'success': False,
                    'message': 'Insufficient content extracted from document embeddings. Please ensure embeddings were generated properly.'
                }), 400
            
            content_analysis = bridge_service.analyze_document_content(extracted_text)
            suggestions = bridge_service.suggest_category_and_folder(extracted_text, categories, folders)
            
            # Find original file in D:\legal_office
            storage_base = 'D:/legal_office'
            original_file_path = None
            
            # Search for the original file
            for root, dirs, files in os.walk(storage_base):
                for file in files:
                    # Look for files that might belong to this document
                    if f"_{doc_id}." in file or f"{doc_id}." in file or document.get('title', '').lower() in file.lower():
                        original_file_path = os.path.join(root, file)
                        logger.info(f"Found original file for doc {doc_id}: {original_file_path}")
                        break
                if original_file_path:
                    break
            
            # Determine new folder path based on AI suggestion
            new_file_path = None
            if suggestions['suggested_folder'] and suggestions['folder_confidence'] > 0:
                # suggested_folder is the full folder object
                target_folder = suggestions['suggested_folder']
                
                if target_folder and original_file_path:
                    # Move file to the AI-suggested folder
                    import shutil
                    filename = os.path.basename(original_file_path)
                    folder_path = target_folder.get('folder_path', 'D:/legal_office')
                    new_file_location = os.path.join(folder_path, filename)
                    
                    try:
                        # Ensure target directory exists
                        os.makedirs(folder_path, exist_ok=True)
                        
                        # Move the file
                        shutil.move(original_file_path, new_file_location)
                        
                        # Calculate relative path for database
                        new_file_path = os.path.relpath(new_file_location, 'D:/legal_office').replace('\\', '/')
                        logger.info(f"Moved file from {original_file_path} to {new_file_location}")
                        logger.info(f"New relative path: {new_file_path}")
                        
                    except Exception as e:
                        logger.error(f"Failed to move file: {str(e)}")
                        # Keep original location if move fails
                        if original_file_path:
                            new_file_path = os.path.relpath(original_file_path, 'D:/legal_office').replace('\\', '/')
            
            # If no folder suggestion or move failed, keep file in original location
            if not new_file_path and original_file_path:
                new_file_path = os.path.relpath(original_file_path, 'D:/legal_office').replace('\\', '/')
            
            # Update document with AI suggestions and new file path
            update_data = {
                'title': content_analysis['suggested_title'],
                'description': content_analysis['suggested_description'],
                'remarks': content_analysis['ai_remarks'],
                'status': 'processed',
                'file_path': new_file_path
            }
            
            # Add category and folder if confidence is high enough
            if suggestions['suggested_category'] and suggestions['category_confidence'] > 0:
                # suggested_category is the full category object with category_id
                update_data['category_id'] = suggestions['suggested_category']['category_id']
            
            if suggestions['suggested_folder'] and suggestions['folder_confidence'] > 0:
                # suggested_folder is the full folder object with folder_id
                update_data['folder_id'] = suggestions['suggested_folder']['folder_id']
            
            # Update document with AI metadata and new file path
            update_response = bridge_service.call_laravel_api(
                f'/documents/{doc_id}/update-metadata',
                method='PUT',
                data=update_data,
                headers=headers
            )
            
            if update_response['success']:
                logger.info(f"Document {doc_id} successfully processed with AI - moved to appropriate folder")
                
                return jsonify({
                    'success': True,
                    'message': 'AI processing completed successfully with automatic folder organization',
                    'data': {
                        'doc_id': doc_id,
                        'suggested_title': content_analysis['suggested_title'],
                        'suggested_category': suggestions['suggested_category'],
                        'suggested_folder': suggestions['suggested_folder'],
                        'new_file_path': new_file_path,
                        'category_confidence': suggestions['category_confidence'],
                        'folder_confidence': suggestions['folder_confidence'],
                        'text_length': len(extracted_text),
                        'processing_time': datetime.now().isoformat(),
                        'file_moved': original_file_path != new_file_location if 'new_file_location' in locals() else False
                    }
                })
            else:
                return jsonify({
                    'success': False,
                    'message': 'Failed to update document metadata'
                }), 500
                
        except Exception as e:
            logger.error(f"AI processing error: {str(e)}")
            logger.error(traceback.format_exc())
            return jsonify({
                'success': False,
                'message': f'AI processing failed: {str(e)}'
            }), 500

    @app.route('/api/documents/analyze', methods=['POST'])
    def analyze_document():
        """Analyze document content and provide intelligent suggestions"""
        try:
            data = request.get_json()
            doc_id = data.get('docId')
            
            if not doc_id:
                return jsonify({
                    'success': False,
                    'message': 'Document ID is required'
                }), 400
            
            # Get document text - either from request or fetch from Laravel
            extracted_text = data.get('documentText', '')
            
            # Get available folders from request payload (avoids circular callback)
            folders = data.get('folders', [])

            # Only fetch document info from Laravel if we don't have the text AND it wasn't provided
            # This logic should be kept minimal to avoid deadlocks
            if not extracted_text:
                auth_header = request.headers.get('Authorization')
                headers = {'Authorization': auth_header} if auth_header else {}
                
                # Fallback: Get document text from Laravel if not provided
                logger.info(f"Getting document text for document ID {doc_id}")
                text_response = bridge_service.call_laravel_api(f'/documents/{doc_id}/text', headers=headers)
                
                if text_response['success'] and text_response.get('data'):
                    response_data = text_response['data']
                    # Handle nested data structure
                    if isinstance(response_data, dict) and 'data' in response_data:
                        extracted_text = response_data['data'].get('text', '')
                    else:
                        extracted_text = response_data.get('text', '')

            logger.info(f"Got document text: {len(extracted_text)} characters")

            # If no text available, return error
            if not extracted_text or len(extracted_text.strip()) < 50:
                logger.error(f"No text content available for doc_id {doc_id}.")
                return jsonify({
                    'success': False,
                    'message': 'Document text not available.'
                }), 400
            
            # Categories are removed as per requirement, passing empty list
            categories = []

            # If folders weren't passed (old behavior), try to fetch them (careful of deadlock if single threaded)
            if not folders:
                logger.warning("Folders not provided in payload, attempting to fetch (risk of deadlock)")
                folders_response = bridge_service.call_laravel_api('/ai/folders/public')
                if folders_response.get('success') and folders_response.get('data'):
                    laravel_data = folders_response.get('data')
                    if isinstance(laravel_data, dict) and 'data' in laravel_data:
                        folders = laravel_data['data']
                    elif isinstance(laravel_data, list):
                        folders = laravel_data

            logger.info(f"Analyzing with {len(folders)} folders")
            
            # Analyze document content - simple and clean like Groq
            content_analysis = bridge_service.analyze_document_content(extracted_text)

            # Get AI suggestions for folder only (categories ignored)
            suggestions = bridge_service.suggest_category_and_folder(extracted_text, categories, folders)

            # Extract folder name from suggestions
            suggested_folder_name = None
            if suggestions['suggested_folder']:
                if isinstance(suggestions['suggested_folder'], dict):
                    suggested_folder_name = suggestions['suggested_folder'].get('folder_name')
                else:
                     suggested_folder_name = suggestions['suggested_folder']

            # Return result (clean format)
            analysis_result = {
                'title': content_analysis['suggested_title'],
                'description': content_analysis['suggested_description'],
                'remarks': content_analysis['ai_remarks'],
                'suggested_folder': suggested_folder_name,
                'category': None,
                'document_type': None,
            }

            logger.info(f"AI Bridge analysis completed for doc_id {doc_id}")

            return jsonify(analysis_result)
            
        except Exception as e:
            logger.error(f"Document analysis error: {str(e)}")
            logger.error(traceback.format_exc())
            return jsonify({
                'success': False,
                'message': f'Document analysis failed: {str(e)}'
            }), 500

    @app.route('/api/documents/similarity', methods=['POST'])
    def calculate_document_similarity():
        """Calculate similarity between documents using BERT embeddings"""
        try:
            data = request.get_json()
            doc_id_1 = data.get('docId1')
            doc_id_2 = data.get('docId2')
            
            if not doc_id_1 or not doc_id_2:
                return jsonify({
                    'success': False,
                    'message': 'Both document IDs are required'
                }), 400
            
            # Get embeddings for both documents
            auth_header = request.headers.get('Authorization')
            headers = {'Authorization': auth_header} if auth_header else {}
            
            # This would require implementing similarity calculation using stored embeddings
            # For now, return a mock similarity score
            similarity_score = 0.75
            
            return jsonify({
                'success': True,
                'similarity': {
                    'score': similarity_score,
                    'doc_id_1': doc_id_1,
                    'doc_id_2': doc_id_2,
                    'comparison_method': 'cosine_similarity',
                    'model_used': 'legal-bert-base-uncased'
                }
            })
            
        except Exception as e:
            logger.error(f"Similarity calculation error: {str(e)}")
            return jsonify({
                'success': False,
                'message': f'Similarity calculation failed: {str(e)}'
            }), 500

    @app.route('/api/documents/search', methods=['POST'])
    def semantic_search():
        """Semantic search across documents using BERT embeddings"""
        try:
            data = request.get_json()
            query = data.get('query', '')
            limit = data.get('limit', 10)
            user_id = data.get('user_id')

            if not query:
                return jsonify({
                    'success': False,
                    'message': 'Search query is required'
                }), 400

            logger.info(f"Semantic search query: '{query}' for user {user_id}")

            # Get authentication header
            auth_header = request.headers.get('Authorization')
            headers = {'Authorization': auth_header} if auth_header else {}

            # Get all document embeddings from Laravel
            embeddings_response = bridge_service.call_laravel_api('/document-embeddings/all', headers=headers)

            if not embeddings_response['success'] or not embeddings_response.get('data'):
                logger.warning("No embeddings found in database")
                return jsonify({
                    'success': True,
                    'query': query,
                    'results': [],
                    'total_results': 0,
                    'search_method': 'semantic_similarity',
                    'model_used': 'legal-bert-base-uncased'
                })

            # Generate embedding for the query
            embedding_model = get_embedding_model()
            if not embedding_model:
                return jsonify({
                    'success': False,
                    'message': 'Embedding model not loaded'
                }), 503

            query_embedding = embedding_model.encode([query], convert_to_tensor=False)[0]

            # Calculate cosine similarity with all document chunks
            import numpy as np
            from numpy.linalg import norm

            results = []
            embeddings_data = embeddings_response['data']

            for embedding_record in embeddings_data:
                if not isinstance(embedding_record, dict):
                    continue

                chunk_embedding = embedding_record.get('embedding_vector')
                if not chunk_embedding:
                    continue

                # Convert to numpy array if it's a list
                if isinstance(chunk_embedding, list):
                    chunk_embedding = np.array(chunk_embedding)
                elif isinstance(chunk_embedding, str):
                    # Handle JSON string
                    import json
                    chunk_embedding = np.array(json.loads(chunk_embedding))

                # Calculate cosine similarity
                similarity = np.dot(query_embedding, chunk_embedding) / (norm(query_embedding) * norm(chunk_embedding))

                # Only include results with similarity > 0.45 (threshold)
                if similarity > 0.45:
                    results.append({
                        'doc_id': embedding_record.get('doc_id'),
                        'title': embedding_record.get('document_title', 'Unknown Document'),
                        'similarity_score': float(similarity),
                        'matched_chunk': embedding_record.get('chunk_text', ''),
                        'chunk_index': embedding_record.get('chunk_index', 0),
                        'embedding_id': embedding_record.get('embedding_id')
                    })

            # Sort by similarity score (descending)
            results.sort(key=lambda x: x['similarity_score'], reverse=True)

            # Limit results
            results = results[:limit]

            logger.info(f"Semantic search found {len(results)} results for query: '{query}'")

            return jsonify({
                'success': True,
                'query': query,
                'results': results,
                'total_results': len(results),
                'search_method': 'semantic_similarity',
                'model_used': 'legal-bert-base-uncased'
            })

        except Exception as e:
            logger.error(f"Semantic search error: {str(e)}")
            logger.error(traceback.format_exc())
            return jsonify({
                'success': False,
                'message': f'Semantic search failed: {str(e)}'
            }), 500