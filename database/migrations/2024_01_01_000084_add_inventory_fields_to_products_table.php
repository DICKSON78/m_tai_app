<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('sku')->nullable()->after('slug');
            $table->string('barcode')->nullable()->after('sku');
            $table->integer('low_stock_threshold')->default(5)->after('quantity');
            $table->integer('reorder_quantity')->default(0)->after('low_stock_threshold');
            $table->boolean('is_track_stock')->default(true)->after('reorder_quantity');
            $table->string('location')->nullable()->after('is_track_stock');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['sku', 'barcode', 'low_stock_threshold', 'reorder_quantity', 'is_track_stock', 'location']);
        });
    }
};
