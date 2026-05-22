<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AIConversation extends Model
{
    protected $table = 'ai_conversation';
    protected $primaryKey = 'conversation_id';
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'doc_id',
        'folder_id',
        'started_at',
        'ended_at',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class, 'doc_id', 'doc_id');
    }

    public function folder(): BelongsTo
    {
        return $this->belongsTo(AIFolder::class, 'folder_id', 'folder_id');
    }

    public function history(): HasMany
    {
        return $this->hasMany(AIHistory::class, 'conversation_id', 'conversation_id');
    }
}