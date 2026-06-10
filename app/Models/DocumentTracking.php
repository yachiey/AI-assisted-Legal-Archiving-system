<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DocumentTracking extends Model
{
    use HasFactory;

    protected $table = 'document_trackings';

    protected $fillable = [
        'doc_id',
        'action',
        'from_location',
        'to_location',
        'borrower',
        'due_date',
        'note',
        'performed_by',
    ];

    protected $casts = [
        'doc_id'       => 'integer',
        'performed_by' => 'integer',
        'due_date'     => 'date',
    ];

    public function document()
    {
        return $this->belongsTo(Document::class, 'doc_id', 'doc_id');
    }

    public function performer()
    {
        return $this->belongsTo(User::class, 'performed_by', 'user_id');
    }
}
