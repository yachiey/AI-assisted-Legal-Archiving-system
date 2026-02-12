<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    use HasFactory;

    protected $primaryKey = 'log_id';
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'doc_id',
        'activity_type',
        'activity_time',
        'activity_details',
        'metadata',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'doc_id' => 'integer',
        'activity_time' => 'datetime',
        'metadata' => 'array',
    ];

    /**
     * Get a safe display title — never returns blank.
     * Priority: metadata snapshot → live document → "Unknown Document".
     */
    public function getDisplayTitleAttribute(): string
    {
        // 1. Check the title snapshot saved at log time (survives deletion)
        $meta = $this->metadata;
        if (is_array($meta) && !empty($meta['document_title']) && trim($meta['document_title']) !== '') {
            return $meta['document_title'];
        }

        // 2. Fall back to the live document relationship
        if ($this->document && trim((string) $this->document->title) !== '') {
            return $this->document->title;
        }

        return 'Unknown Document';
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function document()
    {
        return $this->belongsTo(Document::class, 'doc_id', 'doc_id');
    }
}