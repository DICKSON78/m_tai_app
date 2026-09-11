<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LocationTest extends TestCase
{
    use RefreshDatabase;

    public function test_regions_endpoint_lists_all_mainland_and_zanzibar_regions(): void
    {
        $this->seed(\Database\Seeders\RegionDistrictWardSeeder::class);

        $response = $this->getJson('/api/locations/regions');

        $response->assertOk();
        $data = collect($response->json());
        $this->assertGreaterThanOrEqual(30, $data->count());

        $zanzibar = $data->where('is_archipelago', true)->pluck('name');
        $this->assertTrue(
            $zanzibar->intersect(['Kaskazini Unguja', 'Kusini Unguja', 'Mjini Magharibi', 'Kaskazini Pemba', 'Kusini Pemba'])->count() === 5,
            'Zanzibar regions missing: ' . $zanzibar->implode(', ')
        );
    }

    public function test_districts_are_scoped_to_selected_region(): void
    {
        $this->seed(\Database\Seeders\RegionDistrictWardSeeder::class);

        $id = \App\Models\Region::where('name', 'Dar-es-salaam')->value('id');

        $response = $this->getJson('/api/locations/districts?region_id=' . $id);

        $response->assertOk();
        $names = collect($response->json())->pluck('name');
        $this->assertTrue($names->contains('Ilala'));
        $this->assertTrue($names->contains('Kinondoni'));
        $this->assertFalse($names->contains('Arusha'));
    }

    public function test_wards_are_scoped_to_selected_district(): void
    {
        $this->seed(\Database\Seeders\RegionDistrictWardSeeder::class);

        $id = \App\Models\District::where('name', 'Ilala')->value('id');

        $response = $this->getJson('/api/locations/wards?district_id=' . $id);

        $response->assertOk();
        $this->assertNotEmpty($response->json());
    }

    public function test_ward_district_requires_valid_parent(): void
    {
        $this->getJson('/api/locations/districts')
            ->assertStatus(422);

        $this->getJson('/api/locations/wards?district_id=999999')
            ->assertStatus(422);
    }

    public function test_customer_registration_persists_region_district_ward(): void
    {
        $payload = [
            'name' => 'Mtumiaji Mpya',
            'email' => 'newcust@example.com',
            'phone' => '255700000123',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
            'region' => 'Mjini Magharibi',
            'district' => 'Kaskazini A',
            'ward' => 'Bububu',
        ];

        $response = $this->postJson('/api/register/customer', $payload);

        $response->assertStatus(201);
        $this->assertDatabaseHas('users', [
            'email' => 'newcust@example.com',
            'region' => 'Mjini Magharibi',
            'district' => 'Kaskazini A',
            'ward' => 'Bububu',
        ]);
    }

    public function test_profile_update_saves_region_district_and_street(): void
    {
        $user = \App\Models\User::factory()->create(['role' => 'customer', 'is_active' => true]);

        $response = $this->actingAs($user)
            ->putJson('/api/profile', [
                'region' => 'Kusini Pemba',
                'district' => 'Mkoani',
                'ward' => 'Matumbi',
                'street_or_area' => 'Mkoani Beach',
            ]);

        $response->assertOk();
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'region' => 'Kusini Pemba',
            'district' => 'Mkoani',
            'ward' => 'Matumbi',
            'street' => 'Mkoani Beach',
            'location' => 'Kusini Pemba',
        ]);
    }
}