<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\Document;
use Illuminate\Support\Facades\Log;

class ActivityLogger
{
    // ─── Document Lifecycle ───────────────────────────────────────────
    const DOCUMENT_UPLOADED           = 'document.uploaded';
    const DOCUMENT_AI_PROCESSED       = 'document.ai_processed';
    const DOCUMENT_METADATA_CONFIRMED = 'document.metadata_confirmed';
    const DOCUMENT_METADATA_UPDATED   = 'document.metadata_updated';
    const DOCUMENT_DOWNLOADED         = 'document.downloaded';
    const DOCUMENT_DELETED            = 'document.deleted';
    const DOCUMENT_MOVED              = 'document.moved';
    const DOCUMENT_CHECKED_OUT        = 'document.checked_out';
    const DOCUMENT_CHECKED_IN         = 'document.checked_in';

    // ─── Authentication ───────────────────────────────────────────────
    const AUTH_LOGIN  = 'auth.login';
    const AUTH_LOGOUT = 'auth.logout';

    // ─── Permission Requests ──────────────────────────────────────────
    const PERMISSION_REQUESTED = 'permission.requested';
    const PERMISSION_APPROVED  = 'permission.approved';
    const PERMISSION_DENIED    = 'permission.denied';

    /**
     * Human-readable labels for each activity type.
     */
    private static array $labels = [
        self::DOCUMENT_UPLOADED           => 'Document Uploaded',
        self::DOCUMENT_AI_PROCESSED       => 'AI Processing Completed',
        self::DOCUMENT_METADATA_CONFIRMED => 'Metadata Confirmed',
        self::DOCUMENT_METADATA_UPDATED   => 'Document Updated',
        self::DOCUMENT_DOWNLOADED         => 'Document Downloaded',
        self::DOCUMENT_DELETED            => 'Document Deleted',
        self::DOCUMENT_MOVED              => 'Document Moved',
        self::DOCUMENT_CHECKED_OUT        => 'Document Checked Out',
        self::DOCUMENT_CHECKED_IN         => 'Document Checked In',
        self::AUTH_LOGIN                   => 'User Login',
        self::AUTH_LOGOUT                  => 'User Logout',
        self::PERMISSION_REQUESTED         => 'Permission Requested',
        self::PERMISSION_APPROVED          => 'Permission Approved',
        self::PERMISSION_DENIED            => 'Permission Denied',
    ];

    /**
     * Log an activity.
     *
     * @param string        $type     One of the class constants above.
     * @param Document|null $document The related document (null for auth events).
     * @param int|null      $userId   The acting user – falls back to auth()->id().
     * @param string        $details  Human-readable summary.
     * @param array         $metadata Structured key-value data (old/new values, etc.).
     */
    public static function log(
        string    $type,
        ?Document $document = null,
        ?int      $userId = null,
        string    $details = '',
        array     $metadata = []
    ): ActivityLog {
        $userId = $userId ?? auth()->id();

        // Resolve a safe document title
        $title = self::resolveTitle($document);

        // Auto-generate details if none provided
        if (empty($details) && $document) {
            $details = self::formatLabel($type) . ': ' . $title;
        }

        // Always snapshot the document title into metadata so it
        // survives document deletion and never shows "Unknown Document"
        if ($document) {
            $metadata['document_title'] = $title;
        }

        $activityLog = ActivityLog::create([
            'user_id'          => $userId,
            'doc_id'           => $document?->doc_id,
            'activity_type'    => $type,
            'activity_time'    => now(),
            'activity_details' => $details,
            'metadata'         => !empty($metadata) ? $metadata : null,
        ]);

        Log::info('Activity logged', [
            'type'    => $type,
            'doc_id'  => $document?->doc_id,
            'user_id' => $userId,
        ]);

        return $activityLog;
    }

    /**
     * Return a human-readable label for a given activity type.
     */
    public static function formatLabel(string $type): string
    {
        return self::$labels[$type] ?? ucfirst(str_replace(['.', '_'], ' ', $type));
    }

    /**
     * Resolve a safe display title — never returns blank.
     */
    public static function resolveTitle(?Document $document): string
    {
        if (!$document) {
            return 'Unknown Document';
        }

        $title = trim((string) $document->title);

        return $title !== '' ? $title : 'Unknown Document';
    }
}
