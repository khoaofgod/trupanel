<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\SystemUserController;
use App\Http\Controllers\Api\VhostController;
use App\Http\Controllers\Api\SslCertificateController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Authentication routes
Route::post('/auth/login', [AuthController::class, 'login']);

// Health check route (unprotected)
Route::get('/health', function () {
    return response()->json(['status' => 'ok', 'time' => now()]);
});

// Protected routes
Route::middleware(['auth:sanctum'])->group(function () {
    // Auth routes
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/user', [AuthController::class, 'user']);
    Route::post('/auth/refresh', [AuthController::class, 'refresh']);

    // System Users
    Route::apiResource('system-users', SystemUserController::class)->parameters(['system-users' => 'systemUser']);

    // Virtual Hosts
    Route::apiResource('vhosts', VhostController::class);
    Route::post('vhosts/{vhost}/ssl', [VhostController::class, 'enableSsl']);

    // SSL Certificates
    Route::apiResource('ssl-certificates', SslCertificateController::class)->only(['index', 'show', 'destroy']);

    // System management
    Route::post('/nginx/reload', function () {
        try {
            exec('sudo nginx -t 2>&1', $output, $return_var);
            if ($return_var !== 0) {
                return response()->json(['error' => 'Nginx configuration test failed', 'output' => $output], 400);
            }
            
            exec('sudo systemctl reload nginx 2>&1', $output, $return_var);
            if ($return_var !== 0) {
                return response()->json(['error' => 'Failed to reload nginx', 'output' => $output], 500);
            }
            
            return response()->json(['message' => 'Nginx reloaded successfully']);
        } catch (Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    });

    Route::get('/system/info', function () {
        return response()->json([
            'server' => [
                'hostname' => gethostname(),
                'os' => php_uname('s') . ' ' . php_uname('r'),
                'php_version' => PHP_VERSION,
                'nginx_version' => shell_exec('nginx -v 2>&1') ?: 'Unknown',
                'uptime' => shell_exec('uptime') ?: 'Unknown',
            ],
            'disk' => [
                'total' => disk_total_space('/'),
                'free' => disk_free_space('/'),
                'used' => disk_total_space('/') - disk_free_space('/'),
            ],
            'memory' => sys_getloadavg(),
        ]);
    });
});