<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            $table->foreignId('parent_id')->nullable()->after('business_id')->constrained('accounts')->nullOnDelete();
            $table->string('currency', 3)->nullable()->after('opening_balance')->default('TZS');
            $table->boolean('is_bank_account')->default(false)->after('currency');
            $table->boolean('is_system')->default(false)->after('is_bank_account');
            $table->integer('sort_order')->default(0)->after('is_system');
            $table->text('notes')->nullable()->after('sort_order');
        });

        Schema::table('journal_entry_lines', function (Blueprint $table) {
            $table->foreignId('cost_center_id')->nullable()->after('account_id')->constrained('cost_centers')->nullOnDelete();
            $table->foreignId('currency_id')->nullable()->after('cost_center_id')->constrained('currencies')->nullOnDelete();
            $table->decimal('exchange_rate', 15, 8)->nullable()->after('currency_id')->default(1);
            $table->decimal('amount_currency', 15, 2)->nullable()->after('exchange_rate');
        });

        Schema::table('journal_entries', function (Blueprint $table) {
            $table->foreignId('fiscal_period_id')->nullable()->after('business_id')->constrained('fiscal_periods')->nullOnDelete();
            $table->string('journal_type', 20)->nullable()->after('reference')->default('general');
            $table->foreignId('cost_center_id')->nullable()->after('journal_type')->constrained('cost_centers')->nullOnDelete();
            $table->boolean('is_reversed')->default(false)->after('is_posted');
            $table->foreignId('reversal_of_id')->nullable()->after('is_reversed')->constrained('journal_entries')->nullOnDelete();
        });

        Schema::table('bank_accounts', function (Blueprint $table) {
            $table->decimal('last_reconciled_balance', 15, 2)->nullable()->after('balance');
            $table->date('last_reconciled_date')->nullable()->after('last_reconciled_balance');
        });
    }

    public function down(): void
    {
        Schema::table('bank_accounts', function (Blueprint $table) {
            $table->dropColumn(['last_reconciled_balance', 'last_reconciled_date']);
        });

        Schema::table('journal_entries', function (Blueprint $table) {
            $table->dropColumn(['fiscal_period_id', 'journal_type', 'cost_center_id', 'is_reversed', 'reversal_of_id']);
        });

        Schema::table('journal_entry_lines', function (Blueprint $table) {
            $table->dropColumn(['cost_center_id', 'currency_id', 'exchange_rate', 'amount_currency']);
        });

        Schema::table('accounts', function (Blueprint $table) {
            $table->dropColumn(['parent_id', 'currency', 'is_bank_account', 'is_system', 'sort_order', 'notes']);
        });
    }
};
