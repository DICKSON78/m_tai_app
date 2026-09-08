<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\CreditSale;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CreditSaleTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    protected function setUp(): void
    {
        parent::setUp();

        $this->owner = User::factory()->create(['role' => 'business_owner', 'is_active' => true]);
    }

    private function createCreditSale(Business $business, array $attrs = []): CreditSale
    {
        return $business->creditSales()->create(array_merge([
            'customer_name' => 'Juma Ally',
            'customer_phone' => '0761111111',
            'product_name' => 'Kipande cha Sabuni',
            'quantity' => 2,
            'amount' => 20000,
            'due_date' => now()->addDays(30)->toDateString(),
            'amount_paid' => 0,
            'status' => 'pending',
        ], $attrs));
    }

    public function test_owner_can_create_credit_sale(): void
    {
        $business = Business::factory()->create(['user_id' => $this->owner->id]);

        $this->actingAs($this->owner)
            ->postJson("/api/owner/businesses/{$business->id}/credit-sales", [
                'customer_name' => 'Juma Ally',
                'customer_phone' => '0761111111',
                'product_name' => 'Kipande cha Sabuni',
                'quantity' => 2,
                'amount' => 20000,
                'due_date' => now()->addDays(30)->toDateString(),
            ])
            ->assertStatus(201)
            ->assertJsonPath('credit_sale.customer_name', 'Juma Ally')
            ->assertJsonPath('credit_sale.status', 'pending');

        $this->assertDatabaseHas('credit_sales', [
            'business_id' => $business->id,
            'customer_name' => 'Juma Ally',
            'amount' => 20000,
        ]);
    }

    public function test_owner_can_list_credit_sales(): void
    {
        $business = Business::factory()->create(['user_id' => $this->owner->id]);
        $this->createCreditSale($business);

        $this->actingAs($this->owner)
            ->getJson("/api/owner/businesses/{$business->id}/credit-sales")
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_owner_can_record_partial_payment(): void
    {
        $business = Business::factory()->create(['user_id' => $this->owner->id]);
        $sale = $this->createCreditSale($business);

        $this->actingAs($this->owner)
            ->postJson("/api/owner/businesses/{$business->id}/credit-sales/{$sale->id}/pay", [
                'amount' => 5000,
            ])
            ->assertOk();

        $this->assertDatabaseHas('credit_sales', [
            'id' => $sale->id,
            'amount_paid' => 5000,
            'status' => 'partial',
        ]);
    }

    public function test_owner_can_clear_credit_sale(): void
    {
        $business = Business::factory()->create(['user_id' => $this->owner->id]);
        $sale = $this->createCreditSale($business, ['amount' => 20000]);

        $this->actingAs($this->owner)
            ->postJson("/api/owner/businesses/{$business->id}/credit-sales/{$sale->id}/pay", [
                'amount' => 20000,
            ])
            ->assertOk();

        $this->assertDatabaseHas('credit_sales', [
            'id' => $sale->id,
            'amount_paid' => 20000,
            'status' => 'cleared',
        ]);
    }

    public function test_owner_can_update_credit_sale(): void
    {
        $business = Business::factory()->create(['user_id' => $this->owner->id]);
        $sale = $this->createCreditSale($business);

        $this->actingAs($this->owner)
            ->putJson("/api/owner/businesses/{$business->id}/credit-sales/{$sale->id}", [
                'due_date' => now()->addDays(60)->toDateString(),
            ])
            ->assertOk();
    }

    public function test_owner_can_delete_credit_sale(): void
    {
        $business = Business::factory()->create(['user_id' => $this->owner->id]);
        $sale = $this->createCreditSale($business);

        $this->actingAs($this->owner)
            ->deleteJson("/api/owner/businesses/{$business->id}/credit-sales/{$sale->id}")
            ->assertOk();

        $this->assertDatabaseMissing('credit_sales', ['id' => $sale->id]);
    }

    public function test_non_owner_cannot_manage_credit_sales(): void
    {
        $otherOwner = User::factory()->create(['role' => 'business_owner', 'is_active' => true]);
        $business = Business::factory()->create(['user_id' => $otherOwner->id]);

        $this->actingAs($this->owner)
            ->getJson("/api/owner/businesses/{$business->id}/credit-sales")
            ->assertStatus(403);
    }
}