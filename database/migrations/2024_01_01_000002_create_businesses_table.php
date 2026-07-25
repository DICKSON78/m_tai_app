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
        Schema::create('businesses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('business_name');
            $table->string('business_logo')->nullable();
            $table->string('business_code')->unique();
            $table->string('business_type');
            $table->string('business_category');
            $table->string('region');
            $table->string('district');
            $table->string('ward');
            $table->string('street')->nullable();
            $table->string('road')->nullable();
            $table->json('working_days')->nullable();
            $table->json('working_hours')->nullable();
            $table->string('payment_code');
            $table->string('bank_account_number')->nullable();
            $table->decimal('opening_capital', 15, 2)->default(0);
            $table->enum('status', ['pending', 'active', 'suspended', 'closed'])->default('pending');
            $table->boolean('is_published')->default(false);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('businesses');
    }
};
