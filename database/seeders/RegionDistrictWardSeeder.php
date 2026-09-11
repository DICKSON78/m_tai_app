<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RegionDistrictWardSeeder extends Seeder
{
    public function run(): void
    {
        $path = database_path('data/tz_divisions.json');
        if (! is_file($path)) {
            $this->command?->warn('tz_divisions.json not found; skipping location seed.');

            return;
        }

        DB::table('streets')->truncate();
        DB::table('wards')->truncate();
        DB::table('districts')->truncate();
        DB::table('regions')->truncate();

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

                foreach (array_chunk(array_map(fn ($ward) => [
                    'district_id' => $districtId,
                    'name' => $ward,
                    'created_at' => now(),
                    'updated_at' => now(),
                ], $district['wards']), 500) as $chunk) {
                    DB::table('wards')->insert($chunk);
                }
            }
        }

        $this->seedStreets();
    }

    private function seedStreets(): void
    {
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
}