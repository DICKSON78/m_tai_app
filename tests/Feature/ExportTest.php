<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\Expense;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExportTest extends TestCase
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

    public function test_products_export_as_csv(): void
    {
        Product::factory()->count(3)->create(['business_id' => $this->business->id]);

        $response = $this->actingAs($this->owner)
            ->get("/api/owner/businesses/{$this->business->id}/export/products?format=csv");

        $response->assertOk();
        $response->assertHeader('content-type', 'text/csv; charset=UTF-8');
        $this->assertStringContainsString('"Name","Category"', $response->getContent());
    }

    public function test_products_export_as_xlsx(): void
    {
        Product::factory()->count(3)->create(['business_id' => $this->business->id]);

        $response = $this->actingAs($this->owner)
            ->get("/api/owner/businesses/{$this->business->id}/export/products?format=xlsx");

        $response->assertOk();
        $this->assertStringContainsString('spreadsheetml', $response->headers->get('content-type'));
    }

    public function test_orders_export_as_xlsx(): void
    {
        Order::create([
            'business_id' => $this->business->id,
            'transaction_code' => 'TXN-001',
            'subtotal' => 1000,
            'total' => 1000,
            'status' => 'completed',
            'payment_status' => 'paid',
        ]);

        $response = $this->actingAs($this->owner)
            ->get("/api/owner/businesses/{$this->business->id}/export/orders?format=xlsx");

        $response->assertOk();
        $this->assertStringContainsString('spreadsheetml', $response->headers->get('content-type'));
    }

    public function test_expenses_export_as_csv(): void
    {
        Expense::create([
            'business_id' => $this->business->id,
            'category' => 'rent',
            'amount' => 500,
            'type' => 'daily',
            'date' => now()->toDateString(),
        ]);

        $response = $this->actingAs($this->owner)
            ->get("/api/owner/businesses/{$this->business->id}/export/expenses?format=csv");

        $response->assertOk();
        $this->assertStringContainsString('"Date","Category"', $response->getContent());
    }

    public function test_export_forbidden_for_other_users(): void
    {
        $other = User::factory()->create(['role' => 'business_owner', 'is_active' => true]);

        $this->actingAs($other)
            ->get("/api/owner/businesses/{$this->business->id}/export/products")
            ->assertForbidden();
    }
}
