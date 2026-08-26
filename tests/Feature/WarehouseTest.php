<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\User;
use App\Models\Warehouse;
use App\Models\WarehouseTransfer;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WarehouseTest extends TestCase
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

    public function test_list_warehouses(): void
    {
        Warehouse::create([
            'business_id' => $this->business->id,
            'name' => 'Main Warehouse',
            'code' => 'WH-001',
            'status' => 'active',
        ]);
        Warehouse::create([
            'business_id' => $this->business->id,
            'name' => 'Backup Warehouse',
            'code' => 'WH-002',
            'status' => 'active',
        ]);

        $response = $this->actingAs($this->owner)
            ->getJson('/api/owner/warehouses/');

        $response->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_create_warehouse(): void
    {
        $response = $this->actingAs($this->owner)
            ->postJson('/api/owner/warehouses/', [
                'name' => 'Main Warehouse',
                'address' => '123 Industrial Area',
                'city' => 'Dar es Salaam',
                'total_capacity' => 10000,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('name', 'Main Warehouse')
            ->assertJsonPath('status', 'active');

        $this->assertDatabaseHas('warehouses', [
            'business_id' => $this->business->id,
            'name' => 'Main Warehouse',
        ]);
    }

    public function test_list_warehouse_transfers(): void
    {
        $warehouse1 = Warehouse::create([
            'business_id' => $this->business->id,
            'name' => 'Warehouse A',
            'code' => 'WH-A',
        ]);
        $warehouse2 = Warehouse::create([
            'business_id' => $this->business->id,
            'name' => 'Warehouse B',
            'code' => 'WH-B',
        ]);
        $product = Product::factory()->create(['business_id' => $this->business->id]);

        WarehouseTransfer::create([
            'business_id' => $this->business->id,
            'product_id' => $product->id,
            'from_warehouse_id' => $warehouse1->id,
            'to_warehouse_id' => $warehouse2->id,
            'quantity' => 50,
            'transfer_date' => '2026-01-15',
            'reference_number' => 'TRF-001',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->owner)
            ->getJson('/api/owner/warehouses/transfers/list');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.reference_number', 'TRF-001');
    }

    public function test_create_warehouse_transfer(): void
    {
        $warehouse1 = Warehouse::create([
            'business_id' => $this->business->id,
            'name' => 'Warehouse A',
            'code' => 'WH-A',
        ]);
        $warehouse2 = Warehouse::create([
            'business_id' => $this->business->id,
            'name' => 'Warehouse B',
            'code' => 'WH-B',
        ]);
        $product = Product::factory()->create(['business_id' => $this->business->id, 'quantity' => 100]);

        $response = $this->actingAs($this->owner)
            ->postJson('/api/owner/warehouses/transfers', [
                'product_id' => $product->id,
                'from_warehouse_id' => $warehouse1->id,
                'to_warehouse_id' => $warehouse2->id,
                'quantity' => 50,
                'transfer_date' => '2026-01-15',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('status', 'pending')
            ->assertJsonPath('quantity', 50);

        $this->assertDatabaseHas('warehouse_transfers', [
            'business_id' => $this->business->id,
            'product_id' => $product->id,
        ]);
    }

    public function test_unauthenticated_user_cannot_access_warehouses(): void
    {
        $response = $this->getJson('/api/owner/warehouses/');

        $response->assertStatus(401);
    }

    public function test_non_owner_cannot_access_warehouses(): void
    {
        $customer = User::factory()->create(['role' => 'customer', 'is_active' => true]);

        $response = $this->actingAs($customer)
            ->getJson('/api/owner/warehouses/');

        $response->assertStatus(403);
    }
}
