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
        'two_factor_secret' => 'encrypted',
        'two_factor_recovery_codes' => 'encrypted',
        'two_factor_confirmed_at' => 'datetime',
        'two_factor_email_expires_at' => 'datetime',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'two_factor_email_code',
    ];

    /**
     * Whether the user has enrolled and confirmed two-factor authentication.
     */
    public function hasTwoFactorEnabled(): bool
    {
        return ! is_null($this->two_factor_confirmed_at);
    }

    /**
     * The chosen 2FA method. Accounts enrolled before the email option
     * existed have a null method and are treated as 'totp'.
     */
    public function twoFactorMethod(): string
    {
        return $this->two_factor_method ?: 'totp';
    }

    public function activityLogs()
    {
        return $this->hasMany(ActivityLog::class, 'user_id', 'user_id');
    }

    public function documents()
    {
        return $this->hasMany(Document::class, 'created_by', 'user_id');
    }
}