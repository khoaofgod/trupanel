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
        Schema::create('external_databases', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('type')->default('mysql'); // mysql, mariadb, postgresql
            $table->string('host');
            $table->integer('port')->default(3306);
            $table->string('database');
            $table->string('username');
            $table->string('password'); // encrypted
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_connected_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('external_databases');
    }
};
