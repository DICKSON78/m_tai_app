<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * High-value composite indexes aligned with the application's dominant query
     * patterns (listings, dashboards, reporting aggregations, and lookups).
     * Keyed by [table => [indexName => [columns...]]].
     *
     * @var array<string, array<string, string[]>>
     */
    private array $indexes = [
        'users' => [
            'idx_users_role' => ['role'],
            'idx_users_role_is_active' => ['role', 'is_active'],
            'idx_users_phone' => ['phone'],
        ],
        'businesses' => [
            'idx_businesses_status' => ['status'],
            'idx_businesses_type' => ['business_type'],
        ],
        'orders' => [
            'idx_orders_biz_status_created' => ['business_id', 'status', 'created_at'],
            'idx_orders_payment_status' => ['payment_status'],
        ],
        'order_items' => [
            'idx_order_items_product_created' => ['product_id', 'created_at'],
        ],
        'customers' => [
            'idx_customers_biz_phone' => ['business_id', 'phone'],
            'idx_customers_biz_created' => ['business_id', 'created_at'],
        ],
        'deliveries' => [
            'idx_deliveries_status_transporter' => ['status', 'transporter_id'],
            'idx_deliveries_customer_created' => ['customer_id', 'created_at'],
            'idx_deliveries_biz_created' => ['business_id', 'created_at'],
        ],
        'payments' => [
            'idx_payments_status' => ['status'],
            'idx_payments_method' => ['method'],
            'idx_payments_biz_created' => ['business_id', 'created_at'],
        ],
        'products' => [
            'idx_products_biz_is_track' => ['business_id', 'is_track_stock'],
            'idx_products_biz_category' => ['business_id', 'category_id'],
            'idx_products_biz_created' => ['business_id', 'created_at'],
        ],
        'expenses' => [
            'idx_expenses_biz_date' => ['business_id', 'date'],
            'idx_expenses_biz_type' => ['business_id', 'type'],
            'idx_expenses_biz_category_date' => ['business_id', 'category', 'date'],
        ],
        'loans' => [
            'idx_loans_biz_status' => ['business_id', 'status'],
            'idx_loans_biz_customer' => ['business_id', 'customer_id'],
            'idx_loans_biz_due_status' => ['business_id', 'due_date', 'status'],
        ],
        'loan_payments' => [
            'idx_loan_payments_loan_amount' => ['loan_id', 'amount'],
            'idx_loan_payments_biz_amount' => ['business_id', 'amount'],
        ],
        'credit_sales' => [
            'idx_credit_sales_biz_status' => ['business_id', 'status'],
            'idx_credit_sales_biz_status_due' => ['business_id', 'status', 'due_date'],
            'idx_credit_sales_biz_created' => ['business_id', 'created_at'],
        ],
        'investments' => [
            'idx_investments_biz_type' => ['business_id', 'type'],
            'idx_investments_biz_created' => ['business_id', 'created_at'],
        ],
        'subscriptions' => [
            'idx_subscriptions_biz_status' => ['business_id', 'status'],
            'idx_subscriptions_biz_created' => ['business_id', 'created_at'],
            'idx_subscriptions_status' => ['status'],
        ],
        'categories' => [
            'idx_categories_biz_parent_name' => ['business_id', 'parent_id', 'name'],
        ],
        'stock_movements' => [
            'idx_stock_movements_biz_product_created' => ['business_id', 'product_id', 'created_at'],
            'idx_stock_movements_biz_type_created' => ['business_id', 'type', 'created_at'],
            'idx_stock_movements_reference' => ['reference_type', 'reference_id'],
        ],
        'stock_batches' => [
            'idx_stock_batches_biz_product' => ['business_id', 'product_id'],
        ],
        'stock_counts' => [
            'idx_stock_counts_biz_status' => ['business_id', 'status'],
        ],
        'purchase_receptions' => [
            'idx_pr_biz_status' => ['business_id', 'status'],
            'idx_pr_biz_supplier' => ['business_id', 'supplier_id'],
        ],
        'purchase_returns' => [
            'idx_prr_biz_status' => ['business_id', 'status'],
        ],
        'import_goods' => [
            'idx_import_goods_biz_status' => ['business_id', 'status'],
            'idx_import_goods_biz_created' => ['business_id', 'created_at'],
        ],
        'bill_of_materials' => [
            'idx_bom_biz_status' => ['business_id', 'status'],
        ],
        'invoices' => [
            'idx_invoices_biz_status_date' => ['business_id', 'status', 'date'],
        ],
        'journal_entries' => [
            'idx_journal_entries_biz_posted_date' => ['business_id', 'is_posted', 'date'],
        ],
        'bank_transactions' => [
            'idx_bank_transactions_acct_date' => ['bank_account_id', 'date'],
        ],
        'bills' => [
            'idx_bills_biz_status_date' => ['business_id', 'status', 'date'],
        ],
        'accounts' => [
            'idx_accounts_biz_active_code' => ['business_id', 'is_active', 'code'],
        ],
        'hr_employees' => [
            'idx_hr_employees_biz_status' => ['business_id', 'status'],
        ],
        'payrolls' => [
            'idx_payrolls_biz_status' => ['business_id', 'status'],
        ],
        'payroll_items' => [
            'idx_payroll_items_payroll_status' => ['payroll_id', 'status'],
        ],
        'platform_notifications' => [
            'idx_platform_notifs_type' => ['type'],
            'idx_platform_notifs_created' => ['created_at'],
        ],
        'employees' => [
            'idx_employees_biz_position' => ['business_id', 'position'],
            'idx_employees_biz_is_active' => ['business_id', 'is_active'],
            'idx_employees_biz_phone' => ['business_id', 'phone'],
        ],
        'tax_rates' => [
            'idx_tax_rates_biz_active' => ['business_id', 'is_active'],
        ],
    ];

    public function up(): void
    {
        foreach ($this->indexes as $table => $indexes) {
            if (!Schema::hasTable($table)) {
                continue;
            }

            Schema::table($table, function (Blueprint $tableBlueprint) use ($table, $indexes) {
                foreach ($indexes as $name => $columns) {
                    try {
                        if (!Schema::hasIndex($table, $columns)) {
                            $tableBlueprint->index($columns, $name);
                        }
                    } catch (\Exception $e) {
                        // Column may not exist on this table; skip gracefully.
                    }
                }
            });
        }
    }

    public function down(): void
    {
        foreach ($this->indexes as $table => $indexes) {
            if (!Schema::hasTable($table)) {
                continue;
            }

            foreach ($indexes as $name => $columns) {
                try {
                    if (Schema::hasIndex($table, $columns)) {
                        Schema::table($table, function (Blueprint $tableBlueprint) use ($name) {
                            $tableBlueprint->dropIndex($name);
                        });
                    }
                } catch (\Exception $e) {
                    // Ignore missing indexes on rollback.
                }
            }
        }
    }
};
