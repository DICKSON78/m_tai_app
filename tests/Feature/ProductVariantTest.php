<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductVariantTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    protected function setUp(): void
    {
        parent::setUp();

        $this->owner = User::factory()->create(['role' => 'business_owner', 'is_active' => true]);
    }

    private function createProduct(): Product
    {
        $business = Business::factory()->create(['user_id' => $this->owner->id]);

        return Product::factory()->create(['business_id' => $business->id]);
    }

    public function test_owner_can_create_product_variant(): void
    {
        $product = $this->createProduct();

        $this->actingAs($this->owner)
            ->postJson('/api/owner/product-variants', [
                'product_id' => $product->id,
                'name' => 'Nyeupe / M',
                'sku' => 'SHIRT-W-M',
                'price' => 15000,
                'quantity' => 10,
                'attributes' => ['color' => 'white', 'size' => 'M'],
            ])
            ->assertStatus(201)
            ->assertJsonPath('name', 'Nyeupe / M');

        $this->assertDatabaseHas('product_variants', [
            'product_id' => $product->id,
            'name' => 'Nyeupe / M',
            'sku' => 'SHIRT-W-M',
        ]);
    }

    public function test_owner_can_list_product_variants(): void
    {
        $product = $this->createProduct();

        ProductVariant::create([
            'product_id' => $product->id,
            'name' => 'Nyeupe',
            'price' => 15000,
            'quantity' => 5,
        ]);
        ProductVariant::create([
            'product_id' => $product->id,
            'name' => 'Nyeusi',
            'price' => 15000,
            'quantity' => 5,
        ]);

        $this->actingAs($this->owner)
            ->getJson("/api/owner/product-variants?product_id={$product->id}")
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_owner_can_update_product_variant(): void
    {
        $product = $this->createProduct();

        $variant = ProductVariant::create([
            'product_id' => $product->id,
            'name' => 'Nyeupe',
            'price' => 15000,
            'quantity' => 5,
        ]);

        $this->actingAs($this->owner)
            ->putJson("/api/owner/product-variants/{$variant->id}", [
                'price' => 18000,
            ])
            ->assertOk();

        $this->assertDatabaseHas('product_variants', ['id' => $variant->id, 'price' => 18000]);
    }

    public function test_owner_can_delete_product_variant(): void
    {
        $product = $this->createProduct();

        $variant = ProductVariant::create([
            'product_id' => $product->id,
            'name' => 'Nyeupe',
            'price' => 15000,
            'quantity' => 5,
        ]);

        $this->actingAs($this->owner)
            ->deleteJson("/api/owner/product-variants/{$variant->id}")
            ->assertOk();

        $this->assertDatabaseMissing('product_variants', ['id' => $variant->id]);
    }

    public function test_non_owner_cannot_manage_variants_of_others_product(): void
    {
        $otherOwner = User::factory()->create(['role' => 'business_owner', 'is_active' => true]);
        $business = Business::factory()->create(['user_id' => $otherOwner->id]);
        $product = Product::factory()->create(['business_id' => $business->id]);

        $variant = ProductVariant::create([
            'product_id' => $product->id,
            'name' => 'Nyeupe',
            'price' => 15000,
            'quantity' => 5,
        ]);

        $this->actingAs($this->owner)
            ->getJson("/api/owner/product-variants/{$variant->id}")
            ->assertStatus(403);
    }
}