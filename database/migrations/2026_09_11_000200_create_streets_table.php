<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('streets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ward_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->boolean('is_seeded')->default(false);
            $table->timestamps();
            $table->unique(['ward_id', 'name']);
        });

        // Seed curated real street names for major towns. Entries have a NULL
        // ward_id, meaning they apply to every ward in their district; custom
        // streets learned from user input carry a specific ward_id.
        if (app()->runningUnitTests()) {
            return;
        }

        if (DB::table('streets')->exists()) {
            return;
        }

        $path = database_path('data/streets.json');
        if (! is_file($path)) {
            return;
        }

        $normalize = fn ($s) => preg_replace('/[\s-]+/', '', mb_strtolower(trim((string) $s)));
        $districts = DB::table('districts')->get(['id', 'name']);

        foreach (json_decode(file_get_contents($path), true) as $entry) {
            $district = $districts->first(fn ($d) => $normalize($d->name) === $normalize($entry['district']));
            if ($district === null) {
                continue;
            }

            foreach ($entry['streets'] as $street) {
                DB::table('streets')->insert([
                    'ward_id' => null,
                    'name' => $street,
                    'is_seeded' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('streets');
    }
};