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
        Schema::create('business_capitals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->decimal('capital_amount', 15, 2);
            $table->enum('source', [
                'personal_savings',
                'salary_income',
                'farm_income',
                'bank_loan',
                'friendly_loan',
                'mali_kauli_loan',
                'amana_cash',
                'other',
            ]);
            $table->text('designation')->nullable();
            $table->date('registration_date');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('business_capitals');
    }
};
