<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PurchaseTest extends TestCase
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

    public function test_list_suppliers(): void
    {
        Supplier::create([
            'business_id' => $this->business->id,
            'name' => 'Acme Supplies',
            'code' => 'SUP-001',
            'is_active' => true,
        ]);
        Supplier::create([
            'business_id' => $this->business->id,
            'name' => 'Beta Parts',
            'code' => 'SUP-002',
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->owner)
            ->getJson('/api/owner/purchases/suppliers');

        $response->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.name', 'Acme Supplies')
            ->assertJsonPath('data.1.name', 'Beta Parts');
    }

    public function test_create_supplier(): void
    {
        $response = $this->actingAs($this->owner)
            ->postJson('/api/owner/purchases/suppliers', [
                'name' => 'Acme Supplies',
                'email' => 'orders@acme.com',
                'phone' => '+255700000000',
                'contact_person' => 'John Doe',
                'credit_limit' => 5000000,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('name', 'Acme Supplies');

        $this->assertDatabaseHas('suppliers', [
            'business_id' => $this->business->id,
            'name' => 'Acme Supplies',
        ]);
    }

    public function test_list_purchase_orders(): void
    {
        $supplier = Supplier::create([
            'business_id' => $this->business->id,
            'name' => 'Acme Supplies',
            'code' => 'SUP-001',
        ]);
        PurchaseOrder::create([
            'business_id' => $this->business->id,
            'supplier_id' => $supplier->id,
            'po_number' => 'PO-2026-00001',
            'status' => 'draft',
            'order_date' => '2026-01-15',
            'total' => 0,
        ]);

        $response = $this->actingAs($this->owner)
            ->getJson('/api/owner/purchases/orders');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.po_number', 'PO-2026-00001');
    }

    public function test_create_purchase_order(): void
    {
        $supplier = Supplier::create([
            'business_id' => $this->business->id,
            'name' => 'Acme Supplies',
            'code' => 'SUP-001',
        ]);
        $product = Product::factory()->create(['business_id' => $this->business->id]);

        $response = $this->actingAs($this->owner)
            ->postJson('/api/owner/purchases/orders', [
                'supplier_id' => $supplier->id,
                'order_date' => '2026-01-15',
                'notes' => 'Urgent order',
                'items' => [
                    [
                        'product_id' => $product->id,
                        'description' => 'Widget A',
                        'quantity' => 100,
                        'unit_price' => 5000,
                    ],
                ],
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('status', 'draft')
            ->assertJsonPath('supplier.name', 'Acme Supplies');

        $this->assertDatabaseHas('purchase_orders', [
            'business_id' => $this->business->id,
            'supplier_id' => $supplier->id,
            'status' => 'draft',
        ]);
    }

    public function test_unauthenticated_user_cannot_access_purchases(): void
    {
        $response = $this->getJson('/api/owner/purchases/suppliers');

        $response->assertStatus(401);
    }

    public function test_non_owner_cannot_access_purchases(): void
    {
        $customer = User::factory()->create(['role' => 'customer', 'is_active' => true]);

        $response = $this->actingAs($customer)
            ->getJson('/api/owner/purchases/suppliers');

        $response->assertStatus(403);
    }
}
