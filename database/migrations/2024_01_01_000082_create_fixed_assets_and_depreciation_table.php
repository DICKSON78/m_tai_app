<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fixed_assets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->string('asset_code');
            $table->string('name');
            $table->text('description')->nullable();
            $table->foreignId('category_account_id')->constrained('accounts')->cascadeOnDelete();
            $table->foreignId('depreciation_account_id')->constrained('accounts')->cascadeOnDelete();
            $table->date('purchase_date');
            $table->decimal('purchase_price', 15, 2)->default(0);
            $table->decimal('salvage_value', 15, 2)->default(0);
            $table->integer('useful_life_months');
            $table->enum('depreciation_method', ['straight_line', 'declining_balance', 'sum_of_years', 'units_of_production'])->default('straight_line');
            $table->decimal('accumulated_depreciation', 15, 2)->default(0);
            $table->decimal('current_value', 15, 2)->default(0);
            $table->enum('status', ['active', 'fully_depreciated', 'disposed', 'sold'])->default('active');
            $table->date('disposal_date')->nullable();
            $table->decimal('disposal_price', 15, 2)->default(0);
            $table->foreignId('location_id')->nullable()->constrained('cost_centers')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->unique(['business_id', 'asset_code']);
        });

        Schema::create('depreciation_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('fixed_asset_id')->constrained('fixed_assets')->cascadeOnDelete();
            $table->foreignId('journal_entry_id')->nullable()->constrained('journal_entries')->nullOnDelete();
            $table->date('depreciation_date');
            $table->decimal('amount', 15, 2)->default(0);
            $table->decimal('accumulated_total', 15, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['fixed_asset_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('depreciation_entries');
        Schema::dropIfExists('fixed_assets');
    }
};
