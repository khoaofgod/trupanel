<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SslCertificate extends Model
{
    protected $fillable = [
        'vhost_id',
        'cert_path',
        'key_path',
        'chain_path',
        'expires_at',
        'auto_renew',
        'last_renewed_at',
        'renewal_log',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'last_renewed_at' => 'datetime',
        'auto_renew' => 'boolean',
    ];

    public function vhost(): BelongsTo
    {
        return $this->belongsTo(Vhost::class);
    }
}
