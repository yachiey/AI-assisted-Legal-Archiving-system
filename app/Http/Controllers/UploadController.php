<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use App\Models\Document;
use App\Models\Category;
use App\Models\Folder;

class UploadController extends Controller
{
    /**
     * Handle file upload
     */
    public function store(Request $request)
    {
        try {
            // Debug: Log the incoming request data
            \Log::info('Upload request received', [
                'user_id' => auth()->id(),
                'user_data' => auth()->user(),
                'request_data' => $request->all(),
                'files' => $request->hasFile('file') ? 'File present' : 'No file'
            ]);
            // Validate the request
            $validator = Validator::make($request->all(), [
                'file' => 'required|file|max:10240', // 10MB max
                'folder_id' => 'nullable|exists:folders,folder_id',
                'title' => 'nullable|string|max:255',
                'remarks' => 'nullable|string|max:1000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $file = $request->file('file');
            $originalName = $file->getClientOriginalName();
            $extension = $file->getClientOriginalExtension();

            // Generate unique filename
            $filename = time() . '_' . Str::slug(pathinfo($originalName, PATHINFO_FILENAME)) . '.' . $extension;

            // Store the file
            $path = $file->storeAs('documents', $filename, 'public');

            // Get the authenticated user's full name
            $user = auth()->user();
            $createdByName = 'Unknown User';
            
            if ($user) {
                $createdByName = trim($user->firstname . ' ' . ($user->middle_name ? $user->middle_name . ' ' : '') . $user->lastname);
            }

            // Create document record
            $documentData = [
                'title' => $request->title ?: pathinfo($originalName, PATHINFO_FILENAME),
                'file_path' => $path,
                'created_by' => $createdByName,
                'status' => 'active',
                'folder_id' => $request->folder_id,
                'remarks' => $request->remarks,
            ];
            
            \Log::info('Creating document with data:', $documentData);
            
            $document = Document::create($documentData);
            
            \Log::info('Document created successfully', [
                'doc_id' => $document->doc_id,
                'title' => $document->title,
                'created_by' => $document->created_by
            ]);

            return response()->json([
                'success' => true,
                'message' => 'File uploaded successfully',
                'document' => [
                    'doc_id' => $document->doc_id,
                    'title' => $document->title,
                    'file_path' => $document->file_path,
                    'created_by' => $document->created_by,
                    'status' => $document->status,
                    'folder_id' => $document->folder_id,
                    'remarks' => $document->remarks,
                    'created_at' => $document->created_at,
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Upload failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}