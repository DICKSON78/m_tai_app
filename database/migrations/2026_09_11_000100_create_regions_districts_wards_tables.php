<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('regions', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->boolean('is_archipelago')->default(false);
            $table->timestamps();
        });

        Schema::create('districts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('region_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->timestamps();
            $table->unique(['region_id', 'name']);
        });

        Schema::create('wards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('district_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->timestamps();
            $table->unique(['district_id', 'name']);
        });

        // Seed the full Tanzania reference data (Mainland + Zanzibar) from the
        // bundled dataset so this runs automatically on migrate --force.
        if (app()->runningUnitTests()) {
            return;
        }

        if (DB::table('regions')->exists()) {
            return;
        }

        $path = database_path('data/tz_divisions.json');
        if (! is_file($path)) {
            return;
        }

        $zanzibar = ['Kaskazini Unguja', 'Kusini Unguja', 'Mjini Magharibi', 'Kaskazini Pemba', 'Kusini Pemba'];

        $data = json_decode(file_get_contents($path), true);
        foreach ($data as $region) {
            $regionId = DB::table('regions')->insertGetId([
                'name' => $region['name'],
                'is_archipelago' => in_array($region['name'], $zanzibar, true),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            foreach ($region['districts'] as $district) {
                $districtId = DB::table('districts')->insertGetId([
                    'region_id' => $regionId,
                    'name' => $district['name'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                $wardRows = array_map(fn ($ward) => [
                    'district_id' => $districtId,
                    'name' => $ward,
                    'created_at' => now(),
                    'updated_at' => now(),
                ], $district['wards']);

                foreach (array_chunk($wardRows, 500) as $chunk) {
                    DB::table('wards')->insert($chunk);
                }
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('wards');
        Schema::dropIfExists('districts');
        Schema::dropIfExists('regions');
    }
};