<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Location extends Model
{
    use HasFactory;

    protected $table = 'locations';

    protected $fillable = [
        'name',
        'parent_id',
        'path',
        'created_by',
    ];

    protected $casts = [
        'parent_id'  => 'integer',
        'created_by' => 'integer',
    ];

    public function parent()
    {
        return $this->belongsTo(Location::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Location::class, 'parent_id');
    }

    public function documents()
    {
        return $this->hasMany(Document::class, 'location_id');
    }
}
