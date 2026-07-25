<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $indexes = [
            'products' => ['business_id', 'category_id', 'is_published', 'quantity', 'selling_price'],
            'orders' => ['business_id', 'customer_id', 'status', 'created_at'],
            'order_items' => ['order_id', 'product_id'],
            'stock_movements' => ['business_id', 'product_id', 'type', 'created_at'],
            'expenses' => ['business_id', 'category', 'date'],
            'loans' => ['business_id', 'customer_id', 'status'],
            'customers' => ['business_id', 'user_id'],
            'employees' => ['business_id', 'user_id'],
            'deliveries' => ['business_id', 'order_id', 'transporter_id', 'status'],
            'user_notifications' => ['user_id', 'is_read'],
        ];

        foreach ($indexes as $table => $columns) {
            if (Schema::hasTable($table)) {
                foreach ($columns as $column) {
                    if (!Schema::hasIndex($table, $column)) {
                        Schema::table($table, function (Blueprint $tableBlueprint) use ($column) {
                            $tableBlueprint->index($column);
                        });
                    }
                }
            }
        }
    }

    public function down(): void
    {
        $indexes = [
            'products' => ['business_id', 'category_id', 'is_published', 'quantity', 'selling_price'],
            'orders' => ['business_id', 'customer_id', 'status', 'created_at'],
            'order_items' => ['order_id', 'product_id'],
            'stock_movements' => ['business_id', 'product_id', 'type', 'created_at'],
            'expenses' => ['business_id', 'category', 'date'],
            'loans' => ['business_id', 'customer_id', 'status'],
            'customers' => ['business_id', 'user_id'],
            'employees' => ['business_id', 'user_id'],
            'deliveries' => ['business_id', 'order_id', 'transporter_id', 'status'],
            'user_notifications' => ['user_id', 'is_read'],
        ];

        foreach ($indexes as $table => $columns) {
            if (Schema::hasTable($table)) {
                foreach ($columns as $column) {
                    $indexName = "{$table}_{$column}_index";
                    if (Schema::hasIndex($table, $column)) {
                        Schema::table($table, function (Blueprint $tableBlueprint) use ($indexName) {
                            $tableBlueprint->dropIndex($indexName);
                        });
                    }
                }
            }
        }
    }
};
