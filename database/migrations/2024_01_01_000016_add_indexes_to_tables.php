<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Products indexes
        Schema::table('products', function (Blueprint $table) {
            $table->index('business_id');
            $table->index('category_id');
            $table->index('is_published');
            $table->index('quantity');
            $table->index('selling_price');
        });

        // Orders indexes
        Schema::table('orders', function (Blueprint $table) {
            $table->index('business_id');
            $table->index('customer_id');
            $table->index('status');
            $table->index('created_at');
        });

        // Order items indexes
        Schema::table('order_items', function (Blueprint $table) {
            $table->index('order_id');
            $table->index('product_id');
        });

        // Stock movements indexes
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->index('business_id');
            $table->index('product_id');
            $table->index('type');
            $table->index('created_at');
        });

        // Expenses indexes
        Schema::table('expenses', function (Blueprint $table) {
            $table->index('business_id');
            $table->index('category');
            $table->index('date');
        });

        // Loans indexes
        Schema::table('loans', function (Blueprint $table) {
            $table->index('business_id');
            $table->index('customer_id');
            $table->index('status');
        });

        // Customers indexes
        Schema::table('customers', function (Blueprint $table) {
            $table->index('business_id');
            $table->index('user_id');
        });

        // Employees indexes
        Schema::table('employees', function (Blueprint $table) {
            $table->index('business_id');
            $table->index('user_id');
        });

        // Deliveries indexes
        Schema::table('deliveries', function (Blueprint $table) {
            $table->index('business_id');
            $table->index('order_id');
            $table->index('transporter_id');
            $table->index('status');
        });

        // User notifications indexes
        Schema::table('user_notifications', function (Blueprint $table) {
            $table->index('user_id');
            $table->index('is_read');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['business_id', 'category_id', 'is_published', 'quantity', 'selling_price']);
        });
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['business_id', 'customer_id', 'status', 'created_at']);
        });
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropIndex(['order_id', 'product_id']);
        });
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->dropIndex(['business_id', 'product_id', 'type', 'created_at']);
        });
        Schema::table('expenses', function (Blueprint $table) {
            $table->dropIndex(['business_id', 'category', 'date']);
        });
        Schema::table('loans', function (Blueprint $table) {
            $table->dropIndex(['business_id', 'customer_id', 'status']);
        });
        Schema::table('customers', function (Blueprint $table) {
            $table->dropIndex(['business_id', 'user_id']);
        });
        Schema::table('employees', function (Blueprint $table) {
            $table->dropIndex(['business_id', 'user_id']);
        });
        Schema::table('deliveries', function (Blueprint $table) {
            $table->dropIndex(['business_id', 'order_id', 'transporter_id', 'status']);
        });
        Schema::table('user_notifications', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'is_read']);
        });
    }
};
