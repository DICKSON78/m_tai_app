<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transporters', function (Blueprint $table) {
            if (! Schema::hasColumn('transporters', 'latitude')) {
                $table->decimal('latitude', 10, 7)->nullable();
            }
            if (! Schema::hasColumn('transporters', 'longitude')) {
                $table->decimal('longitude', 10, 7)->nullable();
            }
            if (! Schema::hasColumn('transporters', 'is_online')) {
                $table->boolean('is_online')->default(false);
            }
            if (! Schema::hasColumn('transporters', 'last_location_at')) {
                $table->timestamp('last_location_at')->nullable();
            }
            if (! Schema::hasColumn('transporters', 'region')) {
                $table->string('region')->nullable();
            }
        });

        Schema::table('deliveries', function (Blueprint $table) {
            if (! Schema::hasColumn('deliveries', 'pickup_latitude')) {
                $table->decimal('pickup_latitude', 10, 7)->nullable();
            }
            if (! Schema::hasColumn('deliveries', 'pickup_longitude')) {
                $table->decimal('pickup_longitude', 10, 7)->nullable();
            }
            if (! Schema::hasColumn('deliveries', 'offered_at')) {
                $table->timestamp('offered_at')->nullable();
            }
            if (! Schema::hasColumn('deliveries', 'accepted_at')) {
                $table->timestamp('accepted_at')->nullable();
            }
            if (! Schema::hasColumn('deliveries', 'offer_expires_at')) {
                $table->timestamp('offer_expires_at')->nullable();
            }
            if (! Schema::hasColumn('deliveries', 'auto_dispatched')) {
                $table->boolean('auto_dispatched')->default(false);
            }
        });
    }

    public function down(): void
    {
        Schema::table('deliveries', function (Blueprint $table) {
            foreach (['pickup_latitude', 'pickup_longitude', 'offered_at', 'accepted_at', 'offer_expires_at', 'auto_dispatched'] as $column) {
                if (Schema::hasColumn('deliveries', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        Schema::table('transporters', function (Blueprint $table) {
            foreach (['latitude', 'longitude', 'is_online', 'last_location_at', 'region'] as $column) {
                if (Schema::hasColumn('transporters', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
