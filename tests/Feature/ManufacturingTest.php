<?php

namespace Tests\Feature;

use App\Models\BillOfMaterial;
use App\Models\Business;
use App\Models\Product;
use App\Models\User;
use App\Models\WorkOrder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ManufacturingTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;
    private Business $business;

    protected function setUp(): void
    {
        parent::setUp();
        $this->owner = User::factory()->create(['role' => 'business_owner', 'is_active' => true]);
        $this->business = Business::factory()->create(['user_id' => $this->owner->id]);
        $this->owner->update(['current_business_id' => $this->business->id]);
    }

    public function test_list_boms(): void
    {
        BillOfMaterial::create([
            'business_id' => $this->business->id,
            'name' => 'Widget Assembly',
            'code' => 'BOM-001',
            'product_id' => Product::factory()->create(['business_id' => $this->business->id])->id,
            'status' => 'active',
        ]);

        $response = $this->actingAs($this->owner)
            ->getJson('/api/owner/manufacturing/boms');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Widget Assembly');
    }

    public function test_create_bom(): void
    {
        $product = Product::factory()->create(['business_id' => $this->business->id]);

        $response = $this->actingAs($this->owner)
            ->postJson('/api/owner/manufacturing/boms', [
                'name' => 'Widget Assembly',
                'product_id' => $product->id,
                'description' => 'Main widget BOM',
                'estimated_cost' => 50000,
                'quantity_per_build' => 1,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('name', 'Widget Assembly')
            ->assertJsonPath('status', 'draft');

        $this->assertDatabaseHas('bill_of_materials', [
            'business_id' => $this->business->id,
            'name' => 'Widget Assembly',
        ]);
    }

    public function test_list_work_orders(): void
    {
        WorkOrder::create([
            'business_id' => $this->business->id,
            'order_number' => 'WO-001',
            'product_name' => 'Widget A',
            'quantity_planned' => 100,
            'status' => 'planned',
        ]);

        $response = $this->actingAs($this->owner)
            ->getJson('/api/owner/manufacturing/work-orders');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.order_number', 'WO-001');
    }

    public function test_create_work_order(): void
    {
        $response = $this->actingAs($this->owner)
            ->postJson('/api/owner/manufacturing/work-orders', [
                'product_name' => 'Widget A',
                'quantity_planned' => 100,
                'estimated_cost' => 5000000,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('product_name', 'Widget A')
            ->assertJsonPath('status', 'planned');

        $this->assertDatabaseHas('work_orders', [
            'business_id' => $this->business->id,
            'product_name' => 'Widget A',
        ]);
    }

    public function test_unauthenticated_user_cannot_access_manufacturing(): void
    {
        $response = $this->getJson('/api/owner/manufacturing/boms');

        $response->assertStatus(401);
    }

    public function test_non_owner_cannot_access_manufacturing(): void
    {
        $customer = User::factory()->create(['role' => 'customer', 'is_active' => true]);

        $response = $this->actingAs($customer)
            ->getJson('/api/owner/manufacturing/boms');

        $response->assertStatus(403);
    }
}
