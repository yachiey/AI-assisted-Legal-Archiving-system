<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Folder extends Model
{
    use HasFactory;

     protected $primaryKey = 'folder_id'; // ✅ tell Eloquent your PK is folder_id

    public $incrementing = true; // if it's auto-increment
    protected $keyType = 'int';  // since folder_id is int

    protected $fillable = [
        'folder_name',
        'folder_path',
        'folder_type',
        'parent_folder_id',
        'created_by'
    ];

    // Relationships
    public function children()
    {
        return $this->hasMany(Folder::class, 'parent_folder_id');
    }

    public function parent()
    {
        return $this->belongsTo(Folder::class, 'parent_folder_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by', 'user_id');
    }

    public function documents()
    {
        return $this->hasMany(Document::class, 'folder_id', 'folder_id');
    }
}