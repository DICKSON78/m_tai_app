<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_returns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('supplier_id')->constrained('suppliers')->cascadeOnDelete();
            $table->foreignId('purchase_order_id')->nullable()->constrained('purchase_orders')->nullOnDelete();
            $table->string('return_number');
            $table->date('return_date');
            $table->enum('status', ['draft', 'approved', 'shipped', 'received', 'cancelled'])->default('draft');
            $table->enum('reason', ['defective', 'damaged', 'wrong_item', 'excess', 'quality_issue', 'other'])->default('other');
            $table->text('reason_details')->nullable();
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->enum('resolution', ['refund', 'replacement', 'credit_note', 'pending'])->default('pending');
            $table->decimal('refund_amount', 15, 2)->default(0);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->softDeletes();
            $table->timestamps();

            $table->unique(['business_id', 'return_number']);
            $table->index(['supplier_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_returns');
    }
};
