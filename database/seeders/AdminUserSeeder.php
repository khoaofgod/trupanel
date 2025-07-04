<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        \App\Models\User::create([
            'name' => 'Administrator',
            'email' => 'admin@trupanel.local',
            'password' => \Illuminate\Support\Facades\Hash::make('admin12345'),
            'email_verified_at' => now(),
        ]);
    }
}
