<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;
    private Business $business;

    protected function setUp(): void
    {
        parent::setUp();
        $this->owner = User::factory()->create(['role' => 'business_owner', 'is_active' => true]);
        $this->business = Business::factory()->create(['user_id' => $this->owner->id]);
    }

    public function test_inventory_stock_list_returns_products_with_levels(): void
    {
        Product::factory()->create([
            'business_id' => $this->business->id,
            'quantity' => 0,
            'low_stock_threshold' => 5,
            'is_track_stock' => true,
            'buying_price' => 100,
        ]);
        Product::factory()->create([
            'business_id' => $this->business->id,
            'quantity' => 3,
            'low_stock_threshold' => 5,
            'is_track_stock' => true,
            'buying_price' => 200,
        ]);
        Product::factory()->create([
            'business_id' => $this->business->id,
            'quantity' => 50,
            'low_stock_threshold' => 5,
            'is_track_stock' => true,
            'buying_price' => 300,
        ]);

        $response = $this->actingAs($this->owner)
            ->getJson("/api/owner/businesses/{$this->business->id}/inventory/stock");

        $response->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('data.0.stock_level', 'out_of_stock')
            ->assertJsonPath('data.1.stock_level', 'low')
            ->assertJsonPath('data.2.stock_level', 'healthy');
    }

    public function test_inventory_stock_list_supports_search_filter(): void
    {
        Product::factory()->create([
            'business_id' => $this->business->id,
            'name' => 'Rice Premium',
            'quantity' => 10,
            'is_track_stock' => true,
        ]);
        Product::factory()->create([
            'business_id' => $this->business->id,
            'name' => 'Sugar White',
            'quantity' => 10,
            'is_track_stock' => true,
        ]);

        $response = $this->actingAs($this->owner)
            ->getJson("/api/owner/businesses/{$this->business->id}/inventory/stock?search=Rice");

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Rice Premium');
    }

    public function test_inventory_stock_list_supports_stock_level_filter(): void
    {
        Product::factory()->create([
            'business_id' => $this->business->id,
            'quantity' => 0,
            'low_stock_threshold' => 5,
            'is_track_stock' => true,
        ]);
        Product::factory()->create([
            'business_id' => $this->business->id,
            'quantity' => 3,
            'low_stock_threshold' => 5,
            'is_track_stock' => true,
        ]);

        $response = $this->actingAs($this->owner)
            ->getJson("/api/owner/businesses/{$this->business->id}/inventory/stock?stock_level=low");

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.stock_level', 'low');
    }

    public function test_inventory_summary_returns_totals(): void
    {
        Product::factory()->create([
            'business_id' => $this->business->id,
            'quantity' => 10,
            'buying_price' => 100,
            'selling_price' => 150,
            'low_stock_threshold' => 5,
        ]);

        Product::factory()->create([
            'business_id' => $this->business->id,
            'quantity' => 0,
            'buying_price' => 200,
            'selling_price' => 300,
            'low_stock_threshold' => 5,
        ]);

        $data = $this->actingAs($this->owner)
            ->getJson("/api/owner/businesses/{$this->business->id}/inventory/summary")
            ->assertOk()
            ->json();

        $this->assertEquals(2, $data['total_products']);
        $this->assertEquals(10, $data['total_units']);
        $this->assertEquals(1000.0, (float) $data['value_cost']);
        $this->assertEquals(1500.0, (float) $data['value_retail']);
        $this->assertEquals(1, $data['out_of_stock']);
        $this->assertEquals(0, $data['low_stock']);
    }

    public function test_inventory_summary_only_counts_tracked_products(): void
    {
        Product::factory()->create([
            'business_id' => $this->business->id,
            'quantity' => 20,
            'is_track_stock' => true,
            'buying_price' => 100,
            'selling_price' => 150,
        ]);
        Product::factory()->create([
            'business_id' => $this->business->id,
            'quantity' => 10,
            'is_track_stock' => false,
            'buying_price' => 50,
            'selling_price' => 80,
        ]);

        $data = $this->actingAs($this->owner)
            ->getJson("/api/owner/businesses/{$this->business->id}/inventory/summary")
            ->assertOk()
            ->json();

        $this->assertEquals(1, $data['total_products']);
        $this->assertEquals(20, $data['total_units']);
    }

    public function test_unauthenticated_user_cannot_access_inventory(): void
    {
        $response = $this->getJson("/api/owner/businesses/{$this->business->id}/inventory/stock");

        $response->assertStatus(401);
    }

    public function test_non_owner_cannot_access_inventory(): void
    {
        $otherOwner = User::factory()->create(['role' => 'business_owner', 'is_active' => true]);
        $otherBusiness = Business::factory()->create(['user_id' => $otherOwner->id]);

        $response = $this->actingAs($this->owner)
            ->getJson("/api/owner/businesses/{$otherBusiness->id}/inventory/stock");

        $response->assertStatus(403);
    }
}
