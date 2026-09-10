<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    protected function setUp(): void
    {
        parent::setUp();

        $this->owner = User::factory()->create(['role' => 'business_owner', 'is_active' => true]);
    }

    public function test_owner_can_create_customer(): void
    {
        $business = Business::factory()->create(['user_id' => $this->owner->id]);

        $this->actingAs($this->owner)
            ->postJson("/api/owner/businesses/{$business->id}/customers", [
                'full_name' => 'Juma Ally',
                'phone' => '0761234567',
                'location' => 'Ilala',
            ])
            ->assertStatus(201)
            ->assertJsonPath('customer.full_name', 'Juma Ally')
            ->assertJsonPath('customer.phone', '0761234567');

        $this->assertDatabaseHas('customers', [
            'business_id' => $business->id,
            'full_name' => 'Juma Ally',
            'phone' => '0761234567',
        ]);
    }

    public function test_owner_can_list_customers(): void
    {
        $business = Business::factory()->create(['user_id' => $this->owner->id]);

        Customer::create([
            'business_id' => $business->id,
            'customer_code' => Customer::generateCustomerCode(),
            'full_name' => 'Juma Ally',
            'phone' => '0761111111',
            'is_guest' => false,
        ]);
        Customer::create([
            'business_id' => $business->id,
            'customer_code' => Customer::generateCustomerCode(),
            'full_name' => 'Asha Mwinyi',
            'phone' => '0762222222',
            'is_guest' => false,
        ]);

        $this->actingAs($this->owner)
            ->getJson("/api/owner/businesses/{$business->id}/customers")
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_owner_can_update_customer(): void
    {
        $business = Business::factory()->create(['user_id' => $this->owner->id]);

        $customer = Customer::create([
            'business_id' => $business->id,
            'customer_code' => Customer::generateCustomerCode(),
            'full_name' => 'Juma Ally',
            'phone' => '0761111111',
            'is_guest' => false,
        ]);

        $this->actingAs($this->owner)
            ->putJson("/api/owner/businesses/{$business->id}/customers/{$customer->id}", [
                'full_name' => 'Juma Ali',
            ])
            ->assertOk()
            ->assertJsonPath('customer.full_name', 'Juma Ali');
    }

    public function test_owner_can_delete_customer_without_orders(): void
    {
        $business = Business::factory()->create(['user_id' => $this->owner->id]);

        $customer = Customer::create([
            'business_id' => $business->id,
            'customer_code' => Customer::generateCustomerCode(),
            'full_name' => 'Juma Ally',
            'phone' => '0761111111',
            'is_guest' => false,
        ]);

        $this->actingAs($this->owner)
            ->deleteJson("/api/owner/businesses/{$business->id}/customers/{$customer->id}")
            ->assertOk();

        $this->assertDatabaseMissing('customers', ['id' => $customer->id]);
    }

    public function test_duplicate_phone_is_rejected(): void
    {
        $business = Business::factory()->create(['user_id' => $this->owner->id]);

        Customer::create([
            'business_id' => $business->id,
            'customer_code' => Customer::generateCustomerCode(),
            'full_name' => 'Juma Ally',
            'phone' => '0761111111',
            'is_guest' => false,
        ]);

        $this->actingAs($this->owner)
            ->postJson("/api/owner/businesses/{$business->id}/customers", [
                'full_name' => 'Mtu Mwingine',
                'phone' => '0761111111',
            ])
            ->assertStatus(422);
    }

    public function test_non_owner_cannot_access_customers(): void
    {
        $otherOwner = User::factory()->create(['role' => 'business_owner', 'is_active' => true]);
        $business = Business::factory()->create(['user_id' => $otherOwner->id]);

        $this->actingAs($this->owner)
            ->getJson("/api/owner/businesses/{$business->id}/customers")
            ->assertStatus(403);
    }

    public function test_owner_can_get_customer_stats(): void
    {
        $business = Business::factory()->create(['user_id' => $this->owner->id]);

        $high = Customer::create([
            'business_id' => $business->id,
            'customer_code' => 'CUS-001',
            'full_name' => 'Halima Hassan',
            'phone' => '0712345678',
        ]);
        $none = Customer::create([
            'business_id' => $business->id,
            'customer_code' => 'CUS-002',
            'full_name' => 'Neema John',
            'phone' => '0723456789',
        ]);

        \App\Models\Order::create([
            'business_id' => $business->id,
            'customer_id' => $high->id,
            'transaction_code' => 'TXN-100000001',
            'subtotal' => 20000,
            'discount' => 0,
            'tax' => 0,
            'total' => 20000,
            'status' => 'completed',
            'payment_status' => 'paid',
        ]);

        $response = $this->actingAs($this->owner)
            ->getJson("/api/owner/businesses/{$business->id}/customers/stats");

        $response->assertOk()
            ->assertJsonPath('total_customers', 2)
            ->assertJsonCount(1, 'top_by_spending')
            ->assertJsonPath('top_by_spending.0.full_name', 'Halima Hassan')
            ->assertJsonPath('top_by_spending.0.total_orders', 1);
    }
}