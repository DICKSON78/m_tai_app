<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('data_retention_policies', function (Blueprint $table) {
            $table->id();
            $table->string('model_type');
            $table->integer('retain_days')->default(365);
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_cleanup_at')->nullable();
            $table->timestamps();

            $table->unique('model_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('data_retention_policies');
    }
};
