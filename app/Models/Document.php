<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    use HasFactory;

    protected $primaryKey = 'doc_id';
    
    protected $fillable = [
        'title',
        'description',
        'file_path',
        'file_hash',
        'created_by',
        'status',
        'folder_id',
        'ai_suggested_folder',
        'remarks',
        'physical_location',
        'location_id',
        'tracking_status',
        'checked_out_to',
        'checked_out_at',
        'tracking_due_date',
        'document_ref_id',
    ];

    protected $casts = [
        'folder_id' => 'integer',
        'created_by' => 'integer',
        'location_id' => 'integer',
        'checked_out_at' => 'datetime',
        'tracking_due_date' => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'created_by', 'user_id');
    }

    public function folder()
    {
        return $this->belongsTo(Folder::class, 'folder_id', 'folder_id');
    }

    public function embeddings()
    {
        return $this->hasMany(DocumentEmbedding::class, 'doc_id', 'doc_id');
    }

    public function aiHistories()
    {
        return $this->hasMany(AIHistory::class, 'doc_id', 'doc_id');
    }

    public function conversations()
    {
        return $this->hasMany(AIConversation::class, 'doc_id', 'doc_id');
    }

    public function activityLogs()
    {
        return $this->hasMany(ActivityLog::class, 'doc_id', 'doc_id');
    }

    public function trackings()
    {
        return $this->hasMany(DocumentTracking::class, 'doc_id', 'doc_id');
    }

    public function location()
    {
        return $this->belongsTo(Location::class, 'location_id');
    }
}