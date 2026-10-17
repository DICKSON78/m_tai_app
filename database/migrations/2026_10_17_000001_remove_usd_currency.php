<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Remove the USD currency from the system. Any existing records that were
     * stored in USD are normalised back to the base currency (TZS) before the
     * currency and its exchange rates are deleted.
     */
    public function up(): void
    {
        $usd = DB::table('currencies')->where('code', 'USD')->first();

        if ($usd) {
            // Orders
            if (Schema::hasTable('orders') && Schema::hasColumn('orders', 'currency_code')) {
                DB::table('orders')->where('currency_id', $usd->id)->update(['currency_id' => null]);
                DB::table('orders')->where('currency_code', 'USD')->update([
                    'currency_code' => 'TZS',
                    'exchange_rate' => 1,
                ]);
            }

            // Invoices
            if (Schema::hasTable('invoices') && Schema::hasColumn('invoices', 'currency_code')) {
                DB::table('invoices')->where('currency_id', $usd->id)->update(['currency_id' => null]);
                DB::table('invoices')->where('currency_code', 'USD')->update([
                    'currency_code' => 'TZS',
                    'exchange_rate' => 1,
                ]);
            }

            // Journal entry lines
            if (Schema::hasTable('journal_entry_lines') && Schema::hasColumn('journal_entry_lines', 'currency_id')) {
                DB::table('journal_entry_lines')->where('currency_id', $usd->id)->update(['currency_id' => null]);
            }

            // Plain `currency` code columns on supplier/purchase tables
            foreach (['suppliers', 'purchase_orders', 'supplier_invoices', 'supplier_payments', 'supplier_price_lists'] as $table) {
                if (Schema::hasTable($table) && Schema::hasColumn($table, 'currency')) {
                    DB::table($table)->where('currency', 'USD')->update(['currency' => 'TZS']);
                }
            }

            DB::table('exchange_rates')
                ->where('from_currency', 'USD')
                ->orWhere('to_currency', 'USD')
                ->delete();

            DB::table('currencies')->where('code', 'USD')->delete();
        }
    }

    public function down(): void
    {
        if (! DB::table('currencies')->where('code', 'USD')->exists()) {
            DB::table('currencies')->insert([
                'code' => 'USD',
                'name' => 'US Dollar',
                'symbol' => '$',
                'decimal_places' => 2,
                'is_base' => false,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
};
