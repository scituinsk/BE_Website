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
        Schema::dropIfExists('galleries');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::create('galleries', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('path');
            $table->enum('visibility', ['PUBLIC', 'PRIVATE'])->default('PUBLIC');
            $table->unsignedInteger('width');
            $table->unsignedInteger('height');
            $table->string('mime_type', 50);
            $table->unsignedBigInteger('size');
            $table->string('original_filename', 191);
            $table->decimal('aspect_ratio', 6, 4); // contoh: 1.7778
            $table->foreignId('uploaded_by')->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }
};
