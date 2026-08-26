<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('currency_id')->nullable()->after('business_id')->constrained()->nullOnDelete();
            $table->string('currency_code', 3)->default('TZS')->after('currency_id');
            $table->decimal('exchange_rate', 12, 6)->default(1)->after('currency_code');
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->foreignId('currency_id')->nullable()->after('business_id')->constrained()->nullOnDelete();
            $table->string('currency_code', 3)->default('TZS')->after('currency_id');
            $table->decimal('exchange_rate', 12, 6)->default(1)->after('currency_code');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['currency_id']);
            $table->dropColumn(['currency_id', 'currency_code', 'exchange_rate']);
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropForeign(['currency_id']);
            $table->dropColumn(['currency_id', 'currency_code', 'exchange_rate']);
        });
    }
};
