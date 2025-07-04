<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Vhost extends Model
{
    protected $fillable = [
        'domain',
        'document_root',
        'system_user_id',
        'ssl_enabled',
        'php_version',
        'status',
        'nginx_config',
        'custom_config',
    ];

    protected $casts = [
        'ssl_enabled' => 'boolean',
    ];

    public function systemUser(): BelongsTo
    {
        return $this->belongsTo(SystemUser::class);
    }

    public function sslCertificate(): HasOne
    {
        return $this->hasOne(SslCertificate::class);
    }
}
