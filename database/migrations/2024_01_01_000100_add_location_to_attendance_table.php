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
        Schema::table('attendance', function (Blueprint $table) {
            $table->decimal('latitude', 10, 7)->nullable()->after('clock_out');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            $table->string('location', 255)->nullable()->after('longitude');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendance', function (Blueprint $table) {
            $table->dropColumn(['latitude', 'longitude', 'location']);
        });
    }
};
