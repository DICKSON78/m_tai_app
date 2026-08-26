<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductTest extends TestCase
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

    public function test_owner_can_create_product(): void
    {
        $response = $this->actingAs($this->owner)
            ->postJson("/api/owner/businesses/{$this->business->id}/products", [
                'business_id' => $this->business->id,
                'name' => 'Test Product',
                'buying_price' => 1500,
                'selling_price' => 2500,
                'quantity' => 50,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('name', 'Test Product')
            ->assertJsonPath('selling_price', '2500.00');

        $this->assertDatabaseHas('products', [
            'business_id' => $this->business->id,
            'name' => 'Test Product',
        ]);
    }

    public function test_owner_can_list_products(): void
    {
        Product::factory()->count(3)->create([
            'business_id' => $this->business->id,
        ]);

        $response = $this->actingAs($this->owner)
            ->getJson("/api/owner/businesses/{$this->business->id}/products?business_id={$this->business->id}");

        $response->assertOk()
            ->assertJsonCount(3, 'data');
    }

    public function test_non_owner_cannot_create_product(): void
    {
        $otherOwner = User::factory()->create(['role' => 'business_owner', 'is_active' => true]);
        $otherBusiness = Business::factory()->create(['user_id' => $otherOwner->id]);

        $response = $this->actingAs($this->owner)
            ->postJson("/api/owner/businesses/{$otherBusiness->id}/products", [
                'business_id' => $otherBusiness->id,
                'name' => 'Unauthorized Product',
                'selling_price' => 1000,
                'quantity' => 10,
            ]);

        $response->assertStatus(403);
    }

    public function test_non_owner_cannot_list_products(): void
    {
        $otherOwner = User::factory()->create(['role' => 'business_owner', 'is_active' => true]);
        $otherBusiness = Business::factory()->create(['user_id' => $otherOwner->id]);

        $response = $this->actingAs($this->owner)
            ->getJson("/api/owner/businesses/{$otherBusiness->id}/products?business_id={$otherBusiness->id}");

        $response->assertStatus(403);
    }

    public function test_create_product_validates_required_fields(): void
    {
        $response = $this->actingAs($this->owner)
            ->postJson("/api/owner/businesses/{$this->business->id}/products", [
                'business_id' => $this->business->id,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'selling_price', 'quantity']);
    }

    public function test_customer_role_cannot_create_product(): void
    {
        $customer = User::factory()->create(['role' => 'customer', 'is_active' => true]);

        $response = $this->actingAs($customer)
            ->postJson("/api/owner/businesses/{$this->business->id}/products", [
                'business_id' => $this->business->id,
                'name' => 'Hacker Product',
                'selling_price' => 100,
                'quantity' => 1,
            ]);

        $response->assertStatus(403);
    }

    public function test_owner_can_update_product(): void
    {
        $product = Product::factory()->create([
            'business_id' => $this->business->id,
            'name' => 'Old Name',
        ]);

        $response = $this->actingAs($this->owner)
            ->putJson("/api/owner/products/{$product->id}", [
                'name' => 'New Name',
                'selling_price' => 9999,
            ]);

        $response->assertOk()
            ->assertJsonPath('name', 'New Name');

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'name' => 'New Name',
        ]);
    }

    public function test_owner_can_delete_product(): void
    {
        $product = Product::factory()->create([
            'business_id' => $this->business->id,
        ]);

        $response = $this->actingAs($this->owner)
            ->deleteJson("/api/owner/products/{$product->id}");

        $response->assertOk();
        $this->assertSoftDeleted('products', ['id' => $product->id]);
    }
}
