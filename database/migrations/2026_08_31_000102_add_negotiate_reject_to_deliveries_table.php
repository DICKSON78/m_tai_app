<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('deliveries', function (Blueprint $table) {
            $table->decimal('counter_price', 12, 2)->nullable()->after('offered_price');
            $table->enum('counter_status', ['requested', 'accepted', 'declined'])->nullable()->after('counter_price');
            $table->boolean('rejected')->default(false)->after('counter_status');
            $table->text('rejected_reason')->nullable()->after('rejected');
            $table->unsignedBigInteger('rejected_by')->nullable()->after('rejected_reason');
        });
    }

    public function down(): void
    {
        Schema::table('deliveries', function (Blueprint $table) {
            $table->dropColumn(['counter_price', 'counter_status', 'rejected', 'rejected_reason', 'rejected_by']);
        });
    }
};
