<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\Product;
use App\Models\User;
use App\Models\Wishlist;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WishlistTest extends TestCase
{
    use RefreshDatabase;

    private User $customer;
    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->customer = User::factory()->create(['role' => 'customer', 'is_active' => true]);
        $business = Business::factory()->create(['status' => 'active']);
        $this->product = Product::factory()->create([
            'business_id' => $business->id,
            'is_published' => true,
            'quantity' => 10,
            'selling_price' => 5000,
        ]);
    }

    public function test_add_product_to_wishlist(): void
    {
        $this->actingAs($this->customer)
            ->postJson('/api/wishlist', ['product_id' => $this->product->id])
            ->assertStatus(201)
            ->assertJsonPath('message', 'Bidhaa imeongezwa kwenye mfuataji.');

        $this->assertDatabaseHas('wishlists', [
            'user_id' => $this->customer->id,
            'product_id' => $this->product->id,
        ]);
    }

    public function test_cannot_add_same_product_twice(): void
    {
        Wishlist::create(['user_id' => $this->customer->id, 'product_id' => $this->product->id]);

        $this->actingAs($this->customer)
            ->postJson('/api/wishlist', ['product_id' => $this->product->id])
            ->assertStatus(422);
    }

    public function test_list_wishlist_items(): void
    {
        Wishlist::create(['user_id' => $this->customer->id, 'product_id' => $this->product->id]);

        $this->actingAs($this->customer)
            ->getJson('/api/wishlist')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_check_returns_wishlist_state(): void
    {
        $this->actingAs($this->customer)
            ->getJson("/api/wishlist/check/{$this->product->id}")
            ->assertOk()
            ->assertJsonPath('is_wishlisted', false);

        Wishlist::create(['user_id' => $this->customer->id, 'product_id' => $this->product->id]);

        $this->actingAs($this->customer)
            ->getJson("/api/wishlist/check/{$this->product->id}")
            ->assertOk()
            ->assertJsonPath('is_wishlisted', true);
    }

    public function test_remove_own_wishlist_item(): void
    {
        $wishlist = Wishlist::create(['user_id' => $this->customer->id, 'product_id' => $this->product->id]);

        $this->actingAs($this->customer)
            ->deleteJson("/api/wishlist/{$wishlist->id}")
            ->assertOk();

        $this->assertDatabaseMissing('wishlists', ['id' => $wishlist->id]);
    }

    public function test_cannot_remove_other_users_wishlist_item(): void
    {
        $other = User::factory()->create(['role' => 'customer', 'is_active' => true]);
        $wishlist = Wishlist::create(['user_id' => $other->id, 'product_id' => $this->product->id]);

        $this->actingAs($this->customer)
            ->deleteJson("/api/wishlist/{$wishlist->id}")
            ->assertStatus(404);
    }
}
