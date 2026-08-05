<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\Product;
use App\Models\StockBatch;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryModuleTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Business $business;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create(['role' => 'business_owner']);
        $this->business = Business::factory()->create(['user_id' => $this->user->id]);
    }

    public function test_inventory_stock_list_returns_computed_levels()
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

        $this->actingAs($this->user)
            ->getJson("/api/owner/businesses/{$this->business->id}/inventory/stock")
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.stock_level', 'out_of_stock')
            ->assertJsonPath('data.1.stock_level', 'low');
    }

    public function test_inventory_summary_returns_totals()
    {
        Product::factory()->create([
            'business_id' => $this->business->id,
            'quantity' => 10,
            'buying_price' => 100,
            'selling_price' => 150,
            'low_stock_threshold' => 5,
        ]);

        $data = $this->actingAs($this->user)
            ->getJson("/api/owner/businesses/{$this->business->id}/inventory/summary")
            ->assertOk()
            ->json();

        $this->assertEquals(1, $data['total_products']);
        $this->assertEquals(10, $data['total_units']);
        $this->assertEquals(1000.0, (float) $data['value_cost']);
        $this->assertEquals(1500.0, (float) $data['value_retail']);
    }

    public function test_record_out_movement_blocks_negative_stock()
    {
        $product = Product::factory()->create([
            'business_id' => $this->business->id,
            'quantity' => 2,
        ]);

        $this->actingAs($this->user)
            ->postJson("/api/owner/businesses/{$this->business->id}/inventory/movements", [
                'product_id' => $product->id,
                'type' => 'out',
                'quantity' => 5,
            ])
            ->assertStatus(422);
    }

    public function test_record_movement_creates_movement_and_updates_stock()
    {
        $product = Product::factory()->create([
            'business_id' => $this->business->id,
            'quantity' => 10,
        ]);

        $this->actingAs($this->user)
            ->postJson("/api/owner/businesses/{$this->business->id}/inventory/movements", [
                'product_id' => $product->id,
                'type' => 'out',
                'quantity' => 4,
                'notes' => 'Sold 4 units',
            ])
            ->assertStatus(201)
            ->assertJsonPath('new_quantity', 6);

        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $product->id,
            'type' => 'out',
            'quantity' => 4,
        ]);
        $this->assertEquals(6, $product->fresh()->quantity);
    }

    public function test_store_batch_adds_stock_and_creates_batch()
    {
        $product = Product::factory()->create([
            'business_id' => $this->business->id,
            'quantity' => 10,
            'buying_price' => 500,
        ]);

        $this->actingAs($this->user)
            ->postJson("/api/owner/businesses/{$this->business->id}/inventory/batches", [
                'product_id' => $product->id,
                'batch_number' => 'BATCH-TEST-1',
                'quantity' => 50,
                'expiry_date' => '2026-12-31',
            ])
            ->assertStatus(201)
            ->assertJsonPath('batch.batch_number', 'BATCH-TEST-1');

        $this->assertEquals(60, $product->fresh()->quantity);
        $this->assertEquals(50, StockBatch::where('business_id', $this->business->id)->first()->quantity);
    }

    public function test_stock_count_workflow_generates_counts_and_approves()
    {
        $product = Product::factory()->create([
            'business_id' => $this->business->id,
            'quantity' => 10,
            'buying_price' => 100,
        ]);

        $res = $this->actingAs($this->user)
            ->postJson("/api/owner/businesses/{$this->business->id}/inventory/stock-counts", [
                'name' => 'Weekly count',
                'count_date' => '2026-08-01',
                'generate_items' => true,
            ])
            ->assertStatus(201);

        $countId = $res->json('id');
        $itemId = $res->json('items.0.id');

        $this->actingAs($this->user)
            ->putJson("/api/owner/businesses/{$this->business->id}/inventory/stock-counts/{$countId}/items", [
                'items' => [
                    ['id' => $itemId, 'counted_quantity' => 12],
                ],
            ])
            ->assertOk()
            ->assertJsonPath('status', 'completed');

        $this->actingAs($this->user)
            ->postJson("/api/owner/businesses/{$this->business->id}/inventory/stock-counts/{$countId}/approve")
            ->assertOk()
            ->assertJsonPath('variance_count', 1);

        $this->assertEquals(12, $product->fresh()->quantity);
        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $product->id,
            'type' => 'adjustment',
            'quantity' => 2,
        ]);
    }
}
