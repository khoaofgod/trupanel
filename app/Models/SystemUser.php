<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SystemUser extends Model
{
    protected $fillable = [
        'username',
        'home_directory',
        'shell',
        'ssh_enabled',
        'ftp_enabled',
        'description',
        'created_by',
    ];

    protected $casts = [
        'ssh_enabled' => 'boolean',
        'ftp_enabled' => 'boolean',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function vhosts(): HasMany
    {
        return $this->hasMany(Vhost::class);
    }
}
