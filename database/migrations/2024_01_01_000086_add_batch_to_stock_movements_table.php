<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->foreignId('batch_id')->nullable()->after('product_id')->constrained('stock_batches')->nullOnDelete();
            $table->decimal('unit_cost', 15, 2)->nullable()->after('quantity');
            $table->string('balance_after')->nullable()->after('unit_cost');
        });

        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE stock_movements MODIFY COLUMN type ENUM('in','out','adjustment','sale','sale_return','purchase_receipt','purchase_return','damage','transfer') NOT NULL");
        }
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE stock_movements MODIFY COLUMN type ENUM('in','out','adjustment') NOT NULL");
        }
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->dropColumn(['batch_id', 'unit_cost', 'balance_after']);
        });
    }
};
