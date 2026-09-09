<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::connection()->getDriverName() === 'sqlite') {
            return;
        }

        DB::statement("ALTER TABLE deliveries MODIFY goods_category ENUM('listed','sealed','loose','mkate','chakula','vinywaji','dawa','nguo','vifaa_uyenzi','nyingine') NOT NULL");
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() === 'sqlite') {
            return;
        }

        DB::statement("ALTER TABLE deliveries MODIFY goods_category ENUM('listed','sealed','loose') NOT NULL");
    }
};