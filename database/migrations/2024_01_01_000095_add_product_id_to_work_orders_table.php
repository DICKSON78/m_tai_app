<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('work_orders', function (Blueprint $table) {
            $table->foreignId('product_id')
                ->nullable()
                ->after('bill_of_material_id')
                ->constrained()
                ->nullOnDelete();
            $table->index(['business_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::table('work_orders', function (Blueprint $table) {
            $table->dropForeign(['product_id']);
            $table->dropIndex(['business_id', 'product_id']);
            $table->dropColumn('product_id');
        });
    }
};
