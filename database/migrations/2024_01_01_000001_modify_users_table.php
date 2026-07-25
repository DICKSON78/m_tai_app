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
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->nullable()->after('email');
            $table->string('photo')->nullable();
            $table->string('role')->default('customer');
            $table->string('location')->nullable();
            $table->string('street')->nullable();
            $table->string('road')->nullable();
            $table->integer('age')->nullable();
            $table->string('user_code')->unique()->nullable();
            $table->string('nida_number')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_verified')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'phone',
                'photo',
                'role',
                'location',
                'street',
                'road',
                'age',
                'user_code',
                'nida_number',
                'is_active',
                'is_verified',
            ]);
        });
    }
};
