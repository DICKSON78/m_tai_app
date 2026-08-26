<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ShopProductsTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create([
            'role' => 'customer',
            'is_active' => true,
        ]);
    }

    public function test_shop_products_returns_paginated_results(): void
    {
        $business = Business::factory()->create([
            'status' => 'active',
            'is_published' => true,
        ]);

        Product::factory()->count(5)->create([
            'business_id' => $business->id,
            'is_published' => true,
            'quantity' => 10,
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/shop/products');

        $response->assertOk()
            ->assertJsonCount(5, 'data')
            ->assertJsonPath('total', 5);
    }

    public function test_shop_products_excludes_unpublished(): void
    {
        $business = Business::factory()->create([
            'status' => 'active',
            'is_published' => true,
        ]);

        Product::factory()->create([
            'business_id' => $business->id,
            'is_published' => true,
            'quantity' => 10,
        ]);
        Product::factory()->create([
            'business_id' => $business->id,
            'is_published' => false,
            'quantity' => 10,
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/shop/products');

        $response->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_shop_products_excludes_zero_stock(): void
    {
        $business = Business::factory()->create([
            'status' => 'active',
            'is_published' => true,
        ]);

        Product::factory()->create([
            'business_id' => $business->id,
            'is_published' => true,
            'quantity' => 10,
        ]);
        Product::factory()->create([
            'business_id' => $business->id,
            'is_published' => true,
            'quantity' => 0,
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/shop/products');

        $response->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_shop_products_search(): void
    {
        $business = Business::factory()->create([
            'status' => 'active',
            'is_published' => true,
        ]);

        Product::factory()->create([
            'business_id' => $business->id,
            'name' => 'Rice Premium',
            'is_published' => true,
            'quantity' => 10,
        ]);
        Product::factory()->create([
            'business_id' => $business->id,
            'name' => 'Sugar White',
            'is_published' => true,
            'quantity' => 10,
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/shop/products?search=Rice');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Rice Premium');
    }

    public function test_shop_products_excludes_inactive_businesses(): void
    {
        $activeBusiness = Business::factory()->create([
            'status' => 'active',
            'is_published' => true,
        ]);
        $suspendedBusiness = Business::factory()->create([
            'status' => 'suspended',
            'is_published' => true,
        ]);

        Product::factory()->create([
            'business_id' => $activeBusiness->id,
            'is_published' => true,
            'quantity' => 10,
        ]);
        Product::factory()->create([
            'business_id' => $suspendedBusiness->id,
            'is_published' => true,
            'quantity' => 10,
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/shop/products');

        $response->assertOk()
            ->assertJsonCount(1, 'data');
    }
}
