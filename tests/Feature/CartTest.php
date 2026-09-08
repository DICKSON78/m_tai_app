<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CartTest extends TestCase
{
    use RefreshDatabase;

    private User $customer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->customer = User::factory()->create([
            'role' => 'customer',
            'is_active' => true,
        ]);
    }

    public function test_add_item_to_cart(): void
    {
        $business = Business::factory()->create(['status' => 'active']);
        $product = Product::factory()->create([
            'business_id' => $business->id,
            'is_published' => true,
            'quantity' => 10,
            'selling_price' => 5000,
        ]);

        $this->actingAs($this->customer)
            ->postJson('/api/cart', [
                'product_id' => $product->id,
                'quantity' => 2,
            ])
            ->assertOk()
            ->assertJsonPath('message', 'Imeongezwa kwenye kikapu.')
            ->assertJsonPath('cart_count', 1);
    }

    public function test_does_not_add_unpublished_or_out_of_stock_product(): void
    {
        $business = Business::factory()->create(['status' => 'active']);
        $product = Product::factory()->create([
            'business_id' => $business->id,
            'is_published' => false,
            'quantity' => 0,
        ]);

        $this->actingAs($this->customer)
            ->postJson('/api/cart', [
                'product_id' => $product->id,
                'quantity' => 1,
            ])
            ->assertStatus(422);
    }

    public function test_update_cart_item_quantity(): void
    {
        $business = Business::factory()->create(['status' => 'active']);
        $product = Product::factory()->create([
            'business_id' => $business->id,
            'is_published' => true,
            'quantity' => 10,
            'selling_price' => 5000,
        ]);

        $this->actingAs($this->customer)
            ->postJson('/api/cart', [
                'product_id' => $product->id,
                'quantity' => 2,
            ])
            ->assertOk();

        $this->actingAs($this->customer)
            ->putJson('/api/cart/product_' . $product->id, ['quantity' => 5])
            ->assertOk()
            ->assertJsonPath('cart_count', 1);
    }

    public function test_remove_item_from_cart(): void
    {
        $business = Business::factory()->create(['status' => 'active']);
        $product = Product::factory()->create([
            'business_id' => $business->id,
            'is_published' => true,
            'quantity' => 10,
            'selling_price' => 5000,
        ]);

        $this->actingAs($this->customer)
            ->postJson('/api/cart', ['product_id' => $product->id, 'quantity' => 1])
            ->assertOk();

        $this->actingAs($this->customer)
            ->deleteJson('/api/cart/product_' . $product->id)
            ->assertOk()
            ->assertJsonPath('cart_count', 0);
    }

    public function test_index_returns_cart_items_and_total(): void
    {
        $business = Business::factory()->create(['status' => 'active']);
        $product = Product::factory()->create([
            'business_id' => $business->id,
            'is_published' => true,
            'quantity' => 10,
            'selling_price' => 5000,
        ]);

        $this->actingAs($this->customer)
            ->postJson('/api/cart', ['product_id' => $product->id, 'quantity' => 2])
            ->assertOk();

        $this->actingAs($this->customer)
            ->getJson('/api/cart')
            ->assertOk()
            ->assertJsonPath('count', 1)
            ->assertJsonPath('total', 10000);
    }

    public function test_clear_cart_empties_items(): void
    {
        $business = Business::factory()->create(['status' => 'active']);
        $product = Product::factory()->create([
            'business_id' => $business->id,
            'is_published' => true,
            'quantity' => 10,
            'selling_price' => 5000,
        ]);

        $this->actingAs($this->customer)
            ->postJson('/api/cart', ['product_id' => $product->id, 'quantity' => 1])
            ->assertOk();

        $this->actingAs($this->customer)
            ->deleteJson('/api/cart')
            ->assertOk()
            ->assertJsonPath('cart_count', 0);
    }

    public function test_unauthenticated_user_cannot_access_cart(): void
    {
        $this->getJson('/api/cart')->assertStatus(401);
    }
}
