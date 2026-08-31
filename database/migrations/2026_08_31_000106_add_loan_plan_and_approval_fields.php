<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('loans', function (Blueprint $table) {
            $table->unsignedInteger('repayment_months')->nullable()->after('repayment_plan');
            $table->json('repayment_schedule')->nullable()->after('repayment_months');
            $table->timestamp('approved_at')->nullable()->after('notes');
        });
    }

    public function down(): void
    {
        Schema::table('loans', function (Blueprint $table) {
            $table->dropColumn(['repayment_months', 'repayment_schedule', 'approved_at']);
        });
    }
};
