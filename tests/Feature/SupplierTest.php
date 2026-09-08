<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\SupplierInvoice;
use App\Models\SupplierPayment;
use App\Models\SupplierPriceList;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SupplierTest extends TestCase
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

    private function createSupplier(array $attrs = []): Supplier
    {
        return Supplier::create(array_merge([
            'business_id' => $this->business->id,
            'name' => 'MSUPC',
            'phone' => '0755123456',
        ], $attrs));
    }

    // ---- Supplier ----

    public function test_owner_can_create_supplier(): void
    {
        $this->actingAs($this->owner)
            ->postJson('/api/owner/purchases/suppliers', [
                'name' => 'Mo Dewji',
                'phone' => '0755123456',
                'email' => 'mo@mdco.tz',
            ])
            ->assertStatus(201)
            ->assertJsonPath('name', 'Mo Dewji');

        $this->assertDatabaseHas('suppliers', [
            'business_id' => $this->business->id,
            'name' => 'Mo Dewji',
        ]);
    }

    public function test_owner_can_list_suppliers(): void
    {
        $this->createSupplier();
        Supplier::create(['business_id' => $this->business->id, 'name' => 'Another Sup']);

        $this->actingAs($this->owner)
            ->getJson('/api/owner/purchases/suppliers')
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_owner_can_update_supplier(): void
    {
        $supplier = $this->createSupplier();

        $this->actingAs($this->owner)
            ->putJson("/api/owner/purchases/suppliers/{$supplier->id}", [
                'name' => 'Updated Name',
            ])
            ->assertOk()
            ->assertJsonPath('name', 'Updated Name');
    }

    public function test_owner_can_delete_supplier(): void
    {
        $supplier = $this->createSupplier();

        $this->actingAs($this->owner)
            ->deleteJson("/api/owner/purchases/suppliers/{$supplier->id}")
            ->assertOk();

        $this->assertSoftDeleted('suppliers', ['id' => $supplier->id]);
    }

    public function test_non_owner_cannot_access_supplier(): void
    {
        $otherOwner = User::factory()->create(['role' => 'business_owner', 'is_active' => true]);
        $supplier = Supplier::create(['business_id' => $this->business->id, 'name' => 'Jina']);

        $this->actingAs($otherOwner)
            ->getJson("/api/owner/purchases/suppliers/{$supplier->id}")
            ->assertStatus(403);
    }

    // ---- Supplier Invoices ----

    public function test_owner_can_create_supplier_invoice(): void
    {
        $supplier = $this->createSupplier();

        $this->actingAs($this->owner)
            ->postJson('/api/owner/purchases/invoices', [
                'supplier_id' => $supplier->id,
                'invoice_date' => now()->toDateString(),
                'due_date' => now()->addDays(30)->toDateString(),
                'subtotal' => 200000,
                'tax_amount' => 36000,
            ])
            ->assertStatus(201)
            ->assertJsonPath('supplier_id', $supplier->id);

        $this->assertDatabaseHas('supplier_invoices', [
            'supplier_id' => $supplier->id,
            'subtotal' => 200000,
            'status' => 'draft',
        ]);
    }

    public function test_owner_can_list_supplier_invoices(): void
    {
        $supplier = $this->createSupplier();

        SupplierInvoice::create([
            'business_id' => $this->business->id,
            'supplier_id' => $supplier->id,
            'invoice_number' => 'SINV-2026-00001',
            'invoice_date' => now()->toDateString(),
            'due_date' => now()->addDays(30)->toDateString(),
            'subtotal' => 200000,
            'total' => 200000,
            'status' => 'draft',
        ]);

        $this->actingAs($this->owner)
            ->getJson('/api/owner/purchases/invoices')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    // ---- Supplier Price Lists ----

    public function test_owner_can_create_supplier_price_list(): void
    {
        $supplier = $this->createSupplier();
        $product = Product::factory()->create(['business_id' => $this->business->id]);

        $this->actingAs($this->owner)
            ->postJson('/api/owner/purchases/price-lists', [
                'supplier_id' => $supplier->id,
                'product_id' => $product->id,
                'unit_price' => 4500,
                'min_quantity' => 50,
            ])
            ->assertStatus(201)
            ->assertJsonPath('unit_price', '4500.00');

        $this->assertDatabaseHas('supplier_price_lists', [
            'supplier_id' => $supplier->id,
            'product_id' => $product->id,
            'unit_price' => 4500,
        ]);
    }

    public function test_duplicate_active_price_list_is_rejected(): void
    {
        $supplier = $this->createSupplier();
        $product = Product::factory()->create(['business_id' => $this->business->id]);

        SupplierPriceList::create([
            'business_id' => $this->business->id,
            'supplier_id' => $supplier->id,
            'product_id' => $product->id,
            'unit_price' => 4500,
            'min_quantity' => 50,
            'is_active' => true,
        ]);

        $this->actingAs($this->owner)
            ->postJson('/api/owner/purchases/price-lists', [
                'supplier_id' => $supplier->id,
                'product_id' => $product->id,
                'unit_price' => 5000,
                'min_quantity' => 50,
            ])
            ->assertStatus(422);
    }

    public function test_owner_can_delete_price_list(): void
    {
        $supplier = $this->createSupplier();
        $product = Product::factory()->create(['business_id' => $this->business->id]);

        $priceList = SupplierPriceList::create([
            'business_id' => $this->business->id,
            'supplier_id' => $supplier->id,
            'product_id' => $product->id,
            'unit_price' => 4500,
            'min_quantity' => 50,
            'is_active' => true,
        ]);

        $this->actingAs($this->owner)
            ->deleteJson("/api/owner/purchases/price-lists/{$priceList->id}")
            ->assertOk();

        $this->assertDatabaseMissing('supplier_price_lists', ['id' => $priceList->id]);
    }

    // ---- Supplier Payments ----

    public function test_owner_can_create_supplier_payment(): void
    {
        $supplier = $this->createSupplier();

        $this->actingAs($this->owner)
            ->postJson('/api/owner/purchases/payments', [
                'supplier_id' => $supplier->id,
                'payment_date' => now()->toDateString(),
                'payment_method' => 'cash',
                'amount' => 50000,
            ])
            ->assertStatus(201)
            ->assertJsonPath('supplier_id', $supplier->id);

        $this->assertDatabaseHas('supplier_payments', [
            'supplier_id' => $supplier->id,
            'amount' => 50000,
            'status' => 'pending',
        ]);
    }

    public function test_owner_can_list_supplier_payments(): void
    {
        $supplier = $this->createSupplier();

        SupplierPayment::create([
            'business_id' => $this->business->id,
            'supplier_id' => $supplier->id,
            'payment_number' => 'SPAY-2026-00001',
            'payment_date' => now()->toDateString(),
            'payment_method' => 'cash',
            'amount' => 50000,
            'local_amount' => 50000,
            'status' => 'pending',
        ]);

        $this->actingAs($this->owner)
            ->getJson('/api/owner/purchases/payments')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }
}