<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SystemUserController extends Controller
{
    public function index()
    {
        $users = SystemUser::with('creator', 'vhosts')->get();
        return response()->json($users);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'username' => 'required|string|unique:system_users|regex:/^[a-zA-Z0-9_-]+$/',
            'description' => 'nullable|string',
            'ssh_enabled' => 'boolean',
            'ftp_enabled' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $homeDirectory = '/home/' . $request->username;

        try {
            // Create Linux user
            $command = sprintf(
                'sudo useradd -m -d %s -s /bin/bash %s 2>&1',
                escapeshellarg($homeDirectory),
                escapeshellarg($request->username)
            );
            
            exec($command, $output, $returnVar);
            
            if ($returnVar !== 0) {
                return response()->json(['error' => 'Failed to create system user: ' . implode(' ', $output)], 500);
            }

            // Create database record
            $systemUser = SystemUser::create([
                'username' => $request->username,
                'home_directory' => $homeDirectory,
                'description' => $request->description,
                'ssh_enabled' => $request->ssh_enabled ?? false,
                'ftp_enabled' => $request->ftp_enabled ?? false,
                'created_by' => $request->user()->id,
            ]);

            // Set proper permissions
            exec("sudo chown {$request->username}:{$request->username} {$homeDirectory}");
            exec("sudo chmod 755 {$homeDirectory}");

            return response()->json($systemUser->load('creator'), 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function show(SystemUser $systemUser)
    {
        return response()->json($systemUser->load('creator', 'vhosts'));
    }

    public function update(Request $request, SystemUser $systemUser)
    {
        $validator = Validator::make($request->all(), [
            'description' => 'nullable|string',
            'ssh_enabled' => 'boolean',
            'ftp_enabled' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $systemUser->update($request->only(['description', 'ssh_enabled', 'ftp_enabled']));

        return response()->json($systemUser->load('creator'));
    }

    public function destroy(SystemUser $systemUser)
    {
        try {
            // Remove Linux user
            exec("sudo userdel -r {$systemUser->username} 2>&1", $output, $returnVar);
            
            if ($returnVar !== 0) {
                return response()->json(['error' => 'Failed to remove system user: ' . implode(' ', $output)], 500);
            }

            $systemUser->delete();

            return response()->json(['message' => 'System user deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
