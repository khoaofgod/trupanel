<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('vhosts', function (Blueprint $table) {
            $table->id();
            $table->string('domain')->unique();
            $table->string('document_root');
            $table->foreignId('system_user_id')->constrained('system_users')->onDelete('cascade');
            $table->boolean('ssl_enabled')->default(false);
            $table->string('php_version')->default('8.3');
            $table->string('status')->default('active');
            $table->text('nginx_config')->nullable();
            $table->text('custom_config')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vhosts');
    }
};
