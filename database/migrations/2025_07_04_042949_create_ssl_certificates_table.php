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
        Schema::create('ssl_certificates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vhost_id')->constrained('vhosts')->onDelete('cascade');
            $table->string('cert_path');
            $table->string('key_path');
            $table->string('chain_path')->nullable();
            $table->timestamp('expires_at');
            $table->boolean('auto_renew')->default(true);
            $table->timestamp('last_renewed_at')->nullable();
            $table->text('renewal_log')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ssl_certificates');
    }
};
