<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Remove the KES currency so the system uses TZS only. Any existing records
     * stored in KES are normalised back to the base currency (TZS) before the
     * currency and its exchange rates are deleted.
     */
    public function up(): void
    {
        $kes = DB::table('currencies')->where('code', 'KES')->first();

        if ($kes) {
            if (Schema::hasTable('orders') && Schema::hasColumn('orders', 'currency_code')) {
                DB::table('orders')->where('currency_id', $kes->id)->update(['currency_id' => null]);
                DB::table('orders')->where('currency_code', 'KES')->update([
                    'currency_code' => 'TZS',
                    'exchange_rate' => 1,
                ]);
            }

            if (Schema::hasTable('invoices') && Schema::hasColumn('invoices', 'currency_code')) {
                DB::table('invoices')->where('currency_id', $kes->id)->update(['currency_id' => null]);
                DB::table('invoices')->where('currency_code', 'KES')->update([
                    'currency_code' => 'TZS',
                    'exchange_rate' => 1,
                ]);
            }

            if (Schema::hasTable('journal_entry_lines') && Schema::hasColumn('journal_entry_lines', 'currency_id')) {
                DB::table('journal_entry_lines')->where('currency_id', $kes->id)->update(['currency_id' => null]);
            }

            foreach (['suppliers', 'purchase_orders', 'supplier_invoices', 'supplier_payments', 'supplier_price_lists'] as $table) {
                if (Schema::hasTable($table) && Schema::hasColumn($table, 'currency')) {
                    DB::table($table)->where('currency', 'KES')->update(['currency' => 'TZS']);
                }
            }

            DB::table('exchange_rates')
                ->where('from_currency', 'KES')
                ->orWhere('to_currency', 'KES')
                ->delete();

            DB::table('currencies')->where('code', 'KES')->delete();
        }
    }

    public function down(): void
    {
        if (! DB::table('currencies')->where('code', 'KES')->exists()) {
            DB::table('currencies')->insert([
                'code' => 'KES',
                'name' => 'Kenyan Shilling',
                'symbol' => 'KES',
                'decimal_places' => 2,
                'is_base' => false,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
};
