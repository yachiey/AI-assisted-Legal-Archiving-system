<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    // Tell Laravel the primary key column name
    protected $primaryKey = 'user_id';
    
    // The rest of your model...
    protected $fillable = [
        'lastname',
        'firstname',
        'middle_name',
        'email',
        'password',
        'profile_picture',
        'role',
        'status',
        'can_edit',
        'can_delete',
        'can_upload',
        'can_view',
    ];

    protected $casts = [
        'can_edit' => 'boolean',
        'can_delete' => 'boolean',
        'can_upload' => 'boolean',
        'can_view' => 'boolean',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    public function activityLogs()
    {
        return $this->hasMany(ActivityLog::class, 'user_id', 'user_id');
    }

    public function documents()
    {
        return $this->hasMany(Document::class, 'created_by', 'user_id');
    }
}