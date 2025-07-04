<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vhost;
use App\Models\SystemUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class VhostController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $vhosts = Vhost::with('systemUser', 'sslCertificate')->get();
        return response()->json($vhosts);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'domain' => 'required|string|unique:vhosts|regex:/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/',
            'system_user_id' => 'required|exists:system_users,id',
            'document_root' => 'nullable|string',
            'php_version' => 'nullable|string|in:8.1,8.2,8.3',
            'ssl_enabled' => 'boolean',
            'custom_config' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $systemUser = SystemUser::findOrFail($request->system_user_id);
        $documentRoot = $request->document_root ?: "{$systemUser->home_directory}/public_html";

        try {
            // Create document root directory
            if (!file_exists($documentRoot)) {
                exec("sudo mkdir -p " . escapeshellarg($documentRoot));
                exec("sudo chown {$systemUser->username}:{$systemUser->username} " . escapeshellarg($documentRoot));
                exec("sudo chmod 755 " . escapeshellarg($documentRoot));
                
                // Create a simple index.html
                $indexContent = "<!DOCTYPE html><html><head><title>Welcome to {$request->domain}</title></head><body><h1>Website Under Construction</h1><p>This site is powered by TruPanel.</p></body></html>";
                $tempFile = tempnam(sys_get_temp_dir(), 'index');
                file_put_contents($tempFile, $indexContent);
                exec("sudo mv " . escapeshellarg($tempFile) . " {$documentRoot}/index.html");
                exec("sudo chown {$systemUser->username}:{$systemUser->username} {$documentRoot}/index.html");
            }

            // Generate nginx configuration
            $nginxConfig = $this->generateNginxConfig($request->domain, $documentRoot, $systemUser->username, $request->php_version ?? '8.3', $request->ssl_enabled ?? false, $request->custom_config);

            // Create database record
            $vhost = Vhost::create([
                'domain' => $request->domain,
                'document_root' => $documentRoot,
                'system_user_id' => $request->system_user_id,
                'ssl_enabled' => $request->ssl_enabled ?? false,
                'php_version' => $request->php_version ?? '8.3',
                'status' => 'active',
                'nginx_config' => $nginxConfig,
                'custom_config' => $request->custom_config,
            ]);

            // Write nginx configuration file
            $configPath = "/etc/nginx/sites-available/{$request->domain}";
            $tempConfigFile = tempnam(sys_get_temp_dir(), 'nginx_config');
            file_put_contents($tempConfigFile, $nginxConfig);
            exec("sudo mv " . escapeshellarg($tempConfigFile) . " " . escapeshellarg($configPath));
            
            // Enable the site
            $enabledPath = "/etc/nginx/sites-enabled/{$request->domain}";
            exec("sudo ln -sf " . escapeshellarg($configPath) . " " . escapeshellarg($enabledPath));

            // Test and reload nginx
            exec('sudo nginx -t 2>&1', $testOutput, $testResult);
            if ($testResult === 0) {
                exec('sudo systemctl reload nginx');
            } else {
                // If nginx test fails, remove the configuration and clean up
                exec("sudo rm " . escapeshellarg($configPath));
                exec("sudo rm -f " . escapeshellarg($enabledPath));
                $vhost->delete();
                return response()->json(['error' => 'Nginx configuration test failed', 'output' => $testOutput], 400);
            }

            return response()->json($vhost->load('systemUser', 'sslCertificate'), 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Vhost $vhost)
    {
        return response()->json($vhost->load('systemUser', 'sslCertificate'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Vhost $vhost)
    {
        $validator = Validator::make($request->all(), [
            'document_root' => 'nullable|string',
            'php_version' => 'nullable|string|in:8.1,8.2,8.3',
            'ssl_enabled' => 'boolean',
            'status' => 'nullable|string|in:active,inactive,maintenance',
            'custom_config' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $vhost->update($request->only(['document_root', 'php_version', 'ssl_enabled', 'status', 'custom_config']));

            // Regenerate nginx configuration if needed
            $nginxConfig = $this->generateNginxConfig(
                $vhost->domain,
                $vhost->document_root,
                $vhost->systemUser->username,
                $vhost->php_version,
                $vhost->ssl_enabled,
                $vhost->custom_config
            );

            $vhost->update(['nginx_config' => $nginxConfig]);

            // Update nginx configuration file
            $configPath = "/etc/nginx/sites-available/{$vhost->domain}";
            $tempConfigFile = tempnam(sys_get_temp_dir(), 'nginx_config');
            file_put_contents($tempConfigFile, $nginxConfig);
            exec("sudo mv " . escapeshellarg($tempConfigFile) . " " . escapeshellarg($configPath));

            // Test and reload nginx
            exec('sudo nginx -t 2>&1', $testOutput, $testResult);
            if ($testResult === 0) {
                exec('sudo systemctl reload nginx');
            } else {
                return response()->json(['error' => 'Nginx configuration test failed', 'output' => $testOutput], 400);
            }

            return response()->json($vhost->load('systemUser', 'sslCertificate'));
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Vhost $vhost)
    {
        try {
            // Remove nginx configuration files
            $configPath = "/etc/nginx/sites-available/{$vhost->domain}";
            $enabledPath = "/etc/nginx/sites-enabled/{$vhost->domain}";

            if (file_exists($enabledPath)) {
                exec("sudo rm " . escapeshellarg($enabledPath));
            }
            if (file_exists($configPath)) {
                exec("sudo rm " . escapeshellarg($configPath));
            }

            // Test and reload nginx
            exec('sudo nginx -t 2>&1', $testOutput, $testResult);
            if ($testResult === 0) {
                exec('sudo systemctl reload nginx');
            }

            $vhost->delete();

            return response()->json(['message' => 'Virtual host deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Enable SSL for a virtual host
     */
    public function enableSsl(Request $request, Vhost $vhost)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            // Run Let's Encrypt certificate generation
            $certCommand = sprintf(
                'sudo certbot --nginx -d %s --email %s --agree-tos --non-interactive --redirect',
                escapeshellarg($vhost->domain),
                escapeshellarg($request->email)
            );

            exec($certCommand . ' 2>&1', $output, $returnVar);

            if ($returnVar !== 0) {
                return response()->json(['error' => 'SSL certificate generation failed', 'output' => $output], 500);
            }

            // Update vhost record
            $vhost->update(['ssl_enabled' => true]);

            // Create SSL certificate record
            $vhost->sslCertificate()->create([
                'cert_path' => "/etc/letsencrypt/live/{$vhost->domain}/fullchain.pem",
                'key_path' => "/etc/letsencrypt/live/{$vhost->domain}/privkey.pem",
                'chain_path' => "/etc/letsencrypt/live/{$vhost->domain}/chain.pem",
                'expires_at' => now()->addDays(90),
                'auto_renew' => true,
            ]);

            return response()->json([
                'message' => 'SSL certificate enabled successfully',
                'vhost' => $vhost->load('systemUser', 'sslCertificate')
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Generate nginx configuration for a virtual host
     */
    private function generateNginxConfig(string $domain, string $documentRoot, string $username, string $phpVersion, bool $sslEnabled, ?string $customConfig): string
    {
        $config = "server {\n";
        
        if ($sslEnabled) {
            $config .= "    listen 443 ssl http2;\n";
            $config .= "    listen [::]:443 ssl http2;\n";
            $config .= "    ssl_certificate /etc/letsencrypt/live/{$domain}/fullchain.pem;\n";
            $config .= "    ssl_certificate_key /etc/letsencrypt/live/{$domain}/privkey.pem;\n";
            $config .= "    ssl_protocols TLSv1.2 TLSv1.3;\n";
            $config .= "    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;\n";
            $config .= "    ssl_prefer_server_ciphers off;\n";
        } else {
            $config .= "    listen 80;\n";
            $config .= "    listen [::]:80;\n";
        }

        $config .= "    server_name {$domain};\n";
        $config .= "    root {$documentRoot};\n";
        $config .= "    index index.php index.html index.htm;\n\n";
        
        $config .= "    # Security headers\n";
        $config .= "    add_header X-Frame-Options DENY;\n";
        $config .= "    add_header X-Content-Type-Options nosniff;\n";
        $config .= "    add_header X-XSS-Protection \"1; mode=block\";\n\n";
        
        $config .= "    location / {\n";
        $config .= "        try_files \$uri \$uri/ /index.php?\$query_string;\n";
        $config .= "    }\n\n";
        
        $config .= "    location ~ \\.php\$ {\n";
        $config .= "        fastcgi_pass unix:/var/run/php/php{$phpVersion}-fpm-{$username}.sock;\n";
        $config .= "        fastcgi_index index.php;\n";
        $config .= "        fastcgi_param SCRIPT_FILENAME \$realpath_root\$fastcgi_script_name;\n";
        $config .= "        include fastcgi_params;\n";
        $config .= "    }\n\n";
        
        $config .= "    location ~ /\\.ht {\n";
        $config .= "        deny all;\n";
        $config .= "    }\n\n";
        
        if ($customConfig) {
            $config .= "    # Custom configuration\n";
            $config .= "    {$customConfig}\n\n";
        }
        
        $config .= "}\n";

        // Add HTTP to HTTPS redirect if SSL is enabled
        if ($sslEnabled) {
            $config .= "\nserver {\n";
            $config .= "    listen 80;\n";
            $config .= "    listen [::]:80;\n";
            $config .= "    server_name {$domain};\n";
            $config .= "    return 301 https://\$server_name\$request_uri;\n";
            $config .= "}\n";
        }

        return $config;
    }
}
