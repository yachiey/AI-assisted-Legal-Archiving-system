<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\DocumentTracking;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Handles physical-document location tracking:
 *  - "Cabinets" (distinct physical_location values) for the sidebar
 *  - Per-document movement / borrow history
 *  - Move, check-out, and check-in actions
 */
class DocumentTrackingController extends Controller
{
    /**
     * List cabinets (distinct physical locations) with document counts.
     * Used by the "Cabinets" section in the document sidebar.
     */
    public function cabinets(Request $request)
    {
        $query = Document::query()
            ->where('status', 'active')
            ->whereNotNull('physical_location')
            ->where('physical_location', '!=', '');

        // Optionally scope to a single folder's documents
        if ($request->filled('folder_id')) {
            $query->where('folder_id', $request->input('folder_id'));
        }

        $rows = $query
            ->select('physical_location')
            ->selectRaw('COUNT(*) as total')
            ->selectRaw("SUM(CASE WHEN tracking_status = 'checked_out' THEN 1 ELSE 0 END) as checked_out")
            ->groupBy('physical_location')
            ->orderBy('physical_location')
            ->get();

        $cabinets = $rows->map(fn ($row) => [
            'name'         => $row->physical_location,
            'total'        => (int) $row->total,
            'checked_out'  => (int) $row->checked_out,
        ]);

        return response()->json([
            'success'  => true,
            'cabinets' => $cabinets,
        ]);
    }

    /**
     * Cabinet-first tree: each physical location with the folders (categories)
     * whose documents are stored there. Drives the sidebar navigation.
     */
    public function cabinetTree(Request $request)
    {
        $rows = Document::query()
            ->where('documents.status', 'active')
            ->leftJoin('folders', 'documents.folder_id', '=', 'folders.folder_id')
            ->selectRaw("COALESCE(NULLIF(documents.physical_location, ''), '__none__') as location")
            ->selectRaw('documents.folder_id as folder_id')
            ->selectRaw('folders.folder_name as folder_name')
            ->selectRaw('COUNT(*) as total')
            ->selectRaw("SUM(CASE WHEN documents.tracking_status = 'checked_out' THEN 1 ELSE 0 END) as checked_out")
            ->groupBy('location', 'documents.folder_id', 'folders.folder_name')
            ->get();

        $cabinets = [];
        foreach ($rows as $row) {
            $loc = $row->location;
            if (!isset($cabinets[$loc])) {
                $cabinets[$loc] = [
                    'key'         => $loc,                              // filter value
                    'name'        => $loc === '__none__' ? null : $loc, // null => "No location"
                    'total'       => 0,
                    'checked_out' => 0,
                    'folders'     => [],
                ];
            }
            $cabinets[$loc]['total']       += (int) $row->total;
            $cabinets[$loc]['checked_out'] += (int) $row->checked_out;

            if (!is_null($row->folder_id)) {
                $cabinets[$loc]['folders'][] = [
                    'folder_id'   => (int) $row->folder_id,
                    'folder_name' => $row->folder_name ?? 'Untitled folder',
                    'total'       => (int) $row->total,
                ];
            }
        }

        // Sort folders within each cabinet alphabetically
        foreach ($cabinets as &$cab) {
            usort($cab['folders'], fn ($a, $b) => strcasecmp($a['folder_name'], $b['folder_name']));
        }
        unset($cab);

        // Sort cabinets alphabetically, with "No location" last
        $list = array_values($cabinets);
        usort($list, function ($a, $b) {
            if ($a['name'] === null) return 1;
            if ($b['name'] === null) return -1;
            return strcasecmp($a['name'], $b['name']);
        });

        return response()->json([
            'success'  => true,
            'cabinets' => $list,
        ]);
    }

    /**
     * Get the current tracking state and full history for a document.
     */
    public function history($id)
    {
        $document = Document::findOrFail($id);

        $history = DocumentTracking::with('performer:user_id,firstname,lastname')
            ->where('doc_id', $id)
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($entry) {
                return [
                    'id'            => $entry->id,
                    'action'        => $entry->action,
                    'from_location' => $entry->from_location,
                    'to_location'   => $entry->to_location,
                    'borrower'      => $entry->borrower,
                    'due_date'      => optional($entry->due_date)->toDateString(),
                    'note'          => $entry->note,
                    'performed_by'  => $entry->performer
                        ? trim($entry->performer->firstname . ' ' . $entry->performer->lastname)
                        : 'System',
                    'created_at'    => $entry->created_at?->toIso8601String(),
                ];
            });

        return response()->json([
            'success' => true,
            'current' => [
                'doc_id'            => $document->doc_id,
                'title'             => $document->title,
                'physical_location' => $document->physical_location,
                'tracking_status'   => $document->tracking_status ?? 'in_storage',
                'checked_out_to'    => $document->checked_out_to,
                'checked_out_at'    => optional($document->checked_out_at)->toIso8601String(),
                'due_date'          => optional($document->tracking_due_date)->toDateString(),
            ],
            'history' => $history,
        ]);
    }

    /**
     * Move a document to a new physical location (cabinet/shelf/box).
     */
    public function move(Request $request, $id)
    {
        $validated = $request->validate([
            'to_location' => 'required|string|max:255',
            'note'        => 'nullable|string|max:1000',
        ]);

        if (!$this->canEdit($request)) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to update document tracking',
            ], 403);
        }

        try {
            $document = Document::findOrFail($id);
            $from = $document->physical_location;

            DB::transaction(function () use ($document, $validated, $from, $request) {
                $document->physical_location = $validated['to_location'];
                $document->save();

                DocumentTracking::create([
                    'doc_id'        => $document->doc_id,
                    'action'        => 'moved',
                    'from_location' => $from,
                    'to_location'   => $validated['to_location'],
                    'note'          => $validated['note'] ?? null,
                    'performed_by'  => $request->user()->user_id ?? null,
                ]);
            });

            ActivityLogger::log(
                ActivityLogger::DOCUMENT_MOVED,
                $document,
                $request->user()->user_id ?? null,
                'Document moved: ' . ActivityLogger::resolveTitle($document)
                    . ' (' . ($from ?: 'Unassigned') . ' → ' . $validated['to_location'] . ')',
                ['from' => $from, 'to' => $validated['to_location']]
            );

            return response()->json([
                'success'  => true,
                'message'  => 'Document location updated',
                'document' => $this->currentState($document->fresh()),
            ]);
        } catch (\Exception $e) {
            Log::error('Document move failed', ['doc_id' => $id, 'error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Failed to move document'], 500);
        }
    }

    /**
     * Check out a document to a borrower.
     */
    public function checkOut(Request $request, $id)
    {
        $validated = $request->validate([
            'borrower' => 'required|string|max:255',
            'due_date' => 'nullable|date',
            'note'     => 'nullable|string|max:1000',
        ]);

        if (!$this->canEdit($request)) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to update document tracking',
            ], 403);
        }

        try {
            $document = Document::findOrFail($id);

            if (($document->tracking_status ?? 'in_storage') === 'checked_out') {
                return response()->json([
                    'success' => false,
                    'message' => 'Document is already checked out to ' . ($document->checked_out_to ?: 'someone'),
                ], 422);
            }

            DB::transaction(function () use ($document, $validated, $request) {
                $document->tracking_status   = 'checked_out';
                $document->checked_out_to    = $validated['borrower'];
                $document->checked_out_at    = now();
                $document->tracking_due_date = $validated['due_date'] ?? null;
                $document->save();

                DocumentTracking::create([
                    'doc_id'        => $document->doc_id,
                    'action'        => 'checked_out',
                    'from_location' => $document->physical_location,
                    'borrower'      => $validated['borrower'],
                    'due_date'      => $validated['due_date'] ?? null,
                    'note'          => $validated['note'] ?? null,
                    'performed_by'  => $request->user()->user_id ?? null,
                ]);
            });

            ActivityLogger::log(
                ActivityLogger::DOCUMENT_CHECKED_OUT,
                $document,
                $request->user()->user_id ?? null,
                'Document checked out to ' . $validated['borrower'] . ': ' . ActivityLogger::resolveTitle($document),
                ['borrower' => $validated['borrower'], 'due_date' => $validated['due_date'] ?? null]
            );

            return response()->json([
                'success'  => true,
                'message'  => 'Document checked out',
                'document' => $this->currentState($document->fresh()),
            ]);
        } catch (\Exception $e) {
            Log::error('Document check-out failed', ['doc_id' => $id, 'error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Failed to check out document'], 500);
        }
    }

    /**
     * Check a document back in (return to storage).
     */
    public function checkIn(Request $request, $id)
    {
        $validated = $request->validate([
            'note' => 'nullable|string|max:1000',
        ]);

        if (!$this->canEdit($request)) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to update document tracking',
            ], 403);
        }

        try {
            $document = Document::findOrFail($id);

            if (($document->tracking_status ?? 'in_storage') !== 'checked_out') {
                return response()->json([
                    'success' => false,
                    'message' => 'Document is not currently checked out',
                ], 422);
            }

            $borrower = $document->checked_out_to;

            DB::transaction(function () use ($document, $validated, $borrower, $request) {
                $document->tracking_status   = 'in_storage';
                $document->checked_out_to    = null;
                $document->checked_out_at    = null;
                $document->tracking_due_date = null;
                $document->save();

                DocumentTracking::create([
                    'doc_id'       => $document->doc_id,
                    'action'       => 'checked_in',
                    'to_location'  => $document->physical_location,
                    'borrower'     => $borrower,
                    'note'         => $validated['note'] ?? null,
                    'performed_by' => $request->user()->user_id ?? null,
                ]);
            });

            ActivityLogger::log(
                ActivityLogger::DOCUMENT_CHECKED_IN,
                $document,
                $request->user()->user_id ?? null,
                'Document checked in: ' . ActivityLogger::resolveTitle($document),
                ['returned_by' => $borrower]
            );

            return response()->json([
                'success'  => true,
                'message'  => 'Document checked in',
                'document' => $this->currentState($document->fresh()),
            ]);
        } catch (\Exception $e) {
            Log::error('Document check-in failed', ['doc_id' => $id, 'error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Failed to check in document'], 500);
        }
    }

    /**
     * Whether the acting user may modify tracking data.
     */
    private function canEdit(Request $request): bool
    {
        $user = $request->user();
        return $user && ($user->can_edit || $user->role === 'admin');
    }

    /**
     * Shape the document's current tracking state for responses.
     */
    private function currentState(Document $document): array
    {
        return [
            'doc_id'            => $document->doc_id,
            'physical_location' => $document->physical_location,
            'tracking_status'   => $document->tracking_status ?? 'in_storage',
            'checked_out_to'    => $document->checked_out_to,
            'checked_out_at'    => optional($document->checked_out_at)->toIso8601String(),
            'due_date'          => optional($document->tracking_due_date)->toDateString(),
        ];
    }
}
