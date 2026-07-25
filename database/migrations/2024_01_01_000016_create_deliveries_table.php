<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('deliveries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('goods_category', ['listed', 'sealed', 'loose']);
            $table->text('item_description');
            $table->integer('quantity');
            $table->string('pickup_location');
            $table->string('destination');
            $table->decimal('offered_price', 12, 2);
            $table->boolean('is_negotiable')->default(true);
            $table->enum('status', ['pending', 'accepted', 'in_transit', 'delivered', 'cancelled'])->default('pending');
            $table->unsignedBigInteger('transporter_id')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('deliveries');
    }
};
