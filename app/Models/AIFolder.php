<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AIFolder extends Model
{
    protected $table = 'ai_folders';
    protected $primaryKey = 'folder_id';

    protected $fillable = [
        'user_id',
        'name',
        'color',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function conversations(): HasMany
    {
        return $this->hasMany(AIConversation::class, 'folder_id', 'folder_id');
    }
}
