<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OwnerDashboardTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    private Business $business;

    protected function setUp(): void
    {
        parent::setUp();
        $this->owner = User::factory()->create([
            'role' => 'business_owner',
            'is_active' => true,
        ]);
        $this->business = Business::factory()->create(['user_id' => $this->owner->id]);
    }

    public function test_owner_dashboard_returns_stats(): void
    {
        Product::factory()->count(3)->create([
            'business_id' => $this->business->id,
            'quantity' => 10,
        ]);
        Product::factory()->create([
            'business_id' => $this->business->id,
            'quantity' => 2,
        ]);

        $response = $this->actingAs($this->owner)
            ->getJson('/api/owner/dashboard');

        $response->assertOk()
            ->assertJsonPath('totalProducts', 4)
            ->assertJsonPath('business.id', $this->business->id);
    }

    public function test_owner_dashboard_requires_auth(): void
    {
        $response = $this->getJson('/api/owner/dashboard');

        $response->assertStatus(401);
    }

    public function test_owner_dashboard_requires_owner_role(): void
    {
        $customer = User::factory()->create(['role' => 'customer', 'is_active' => true]);

        $response = $this->actingAs($customer)
            ->getJson('/api/owner/dashboard');

        $response->assertStatus(403);
    }
}
