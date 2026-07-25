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
        Schema::create('loans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->enum('loan_type', [
                'go_pro_bank',
                'go_premiere_friendly',
                'mali_kauli',
                'amana_cash',
                'forgotten_change',
                'other',
            ]);
            $table->decimal('loan_amount', 15, 2);
            $table->decimal('loan_balance', 15, 2);
            $table->text('repayment_plan')->nullable();
            $table->decimal('interest_rate', 5, 2)->default(0);
            $table->enum('status', ['active', 'paid', 'overdue', 'defaulted'])->default('active');
            $table->date('start_date');
            $table->date('due_date')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('loans');
    }
};
