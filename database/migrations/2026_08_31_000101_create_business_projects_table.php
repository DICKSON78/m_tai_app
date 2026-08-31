<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('business_projects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->string('project_name');
            $table->decimal('required_capital', 15, 2)->default(0);
            $table->unsignedInteger('timeline_months')->default(1);
            $table->date('completion_date')->nullable();
            $table->decimal('recommended_loan_amount', 15, 2)->default(0);
            $table->json('savings_plan')->nullable();
            $table->json('allocation')->nullable();
            $table->enum('status', ['active', 'completed', 'cancelled'])->default('active');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('business_projects');
    }
};
