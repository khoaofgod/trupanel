<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class ExternalDatabase extends Model
{
    protected $fillable = [
        'name',
        'type',
        'host',
        'port',
        'database',
        'username',
        'password',
        'description',
        'is_active',
        'last_connected_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'last_connected_at' => 'datetime',
    ];

    protected $hidden = [
        'password',
    ];

    public function setPasswordAttribute($value)
    {
        $this->attributes['password'] = Crypt::encrypt($value);
    }

    public function getPasswordAttribute($value)
    {
        return Crypt::decrypt($value);
    }
}
