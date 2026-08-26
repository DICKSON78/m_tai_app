<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderTest extends TestCase
{
    use RefreshDatabase;

    private User $customerUser;
    private User $owner;
    private Business $business;

    protected function setUp(): void
    {
        parent::setUp();

        $this->owner = User::factory()->create(['role' => 'business_owner', 'is_active' => true]);
        $this->business = Business::factory()->create(['user_id' => $this->owner->id, 'status' => 'active']);

        Product::factory()->create([
            'business_id' => $this->business->id,
            'is_published' => true,
            'quantity' => 20,
            'selling_price' => 5000,
        ]);

        $this->customerUser = User::factory()->create([
            'role' => 'customer',
            'is_active' => true,
        ]);
    }

    public function test_my_orders_returns_customer_orders(): void
    {
        $customer = Customer::create([
            'business_id' => $this->business->id,
            'user_id' => $this->customerUser->id,
            'full_name' => 'John Doe',
            'phone' => '0712345678',
            'customer_code' => 'CTM-000001',
        ]);

        Order::create([
            'business_id' => $this->business->id,
            'customer_id' => $customer->id,
            'transaction_code' => Order::generateTransactionCode(),
            'subtotal' => 10000,
            'discount' => 0,
            'tax' => 0,
            'total' => 10000,
            'status' => 'pending',
            'payment_status' => 'unpaid',
        ]);

        $response = $this->actingAs($this->customerUser)
            ->getJson('/api/orders');

        $response->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_my_orders_excludes_other_customers_orders(): void
    {
        $customer = Customer::create([
            'business_id' => $this->business->id,
            'user_id' => $this->customerUser->id,
            'full_name' => 'John Doe',
            'phone' => '0712345678',
            'customer_code' => 'CTM-000001',
        ]);

        $otherUser = User::factory()->create(['role' => 'customer', 'is_active' => true]);
        $otherCustomer = Customer::create([
            'business_id' => $this->business->id,
            'user_id' => $otherUser->id,
            'full_name' => 'Jane Smith',
            'phone' => '0799999999',
            'customer_code' => 'CTM-000002',
        ]);

        Order::create([
            'business_id' => $this->business->id,
            'customer_id' => $customer->id,
            'transaction_code' => Order::generateTransactionCode(),
            'subtotal' => 5000,
            'discount' => 0,
            'tax' => 0,
            'total' => 5000,
            'status' => 'pending',
            'payment_status' => 'unpaid',
        ]);

        Order::create([
            'business_id' => $this->business->id,
            'customer_id' => $otherCustomer->id,
            'transaction_code' => Order::generateTransactionCode(),
            'subtotal' => 8000,
            'discount' => 0,
            'tax' => 0,
            'total' => 8000,
            'status' => 'pending',
            'payment_status' => 'unpaid',
        ]);

        $response = $this->actingAs($this->customerUser)
            ->getJson('/api/orders');

        $response->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_show_order_allows_customer_owner(): void
    {
        $customer = Customer::create([
            'business_id' => $this->business->id,
            'user_id' => $this->customerUser->id,
            'full_name' => 'John Doe',
            'phone' => '0712345678',
            'customer_code' => 'CTM-000001',
        ]);

        $order = Order::create([
            'business_id' => $this->business->id,
            'customer_id' => $customer->id,
            'transaction_code' => Order::generateTransactionCode(),
            'subtotal' => 5000,
            'discount' => 0,
            'tax' => 0,
            'total' => 5000,
            'status' => 'pending',
            'payment_status' => 'unpaid',
        ]);

        $response = $this->actingAs($this->customerUser)
            ->getJson("/api/orders/{$order->id}");

        $response->assertOk()
            ->assertJsonPath('id', $order->id);
    }

    public function test_show_order_allows_business_owner(): void
    {
        $customer = Customer::create([
            'business_id' => $this->business->id,
            'full_name' => 'John Doe',
            'phone' => '0712345678',
            'customer_code' => 'CTM-000001',
        ]);

        $order = Order::create([
            'business_id' => $this->business->id,
            'customer_id' => $customer->id,
            'transaction_code' => Order::generateTransactionCode(),
            'subtotal' => 5000,
            'discount' => 0,
            'tax' => 0,
            'total' => 5000,
            'status' => 'pending',
            'payment_status' => 'unpaid',
        ]);

        $response = $this->actingAs($this->owner)
            ->getJson("/api/orders/{$order->id}");

        $response->assertOk()
            ->assertJsonPath('id', $order->id);
    }

    public function test_show_order_rejects_unrelated_user(): void
    {
        $customer = Customer::create([
            'business_id' => $this->business->id,
            'user_id' => $this->customerUser->id,
            'full_name' => 'John Doe',
            'phone' => '0712345678',
            'customer_code' => 'CTM-000001',
        ]);

        $order = Order::create([
            'business_id' => $this->business->id,
            'customer_id' => $customer->id,
            'transaction_code' => Order::generateTransactionCode(),
            'subtotal' => 5000,
            'discount' => 0,
            'tax' => 0,
            'total' => 5000,
            'status' => 'pending',
            'payment_status' => 'unpaid',
        ]);

        $unrelatedUser = User::factory()->create(['role' => 'customer', 'is_active' => true]);

        $response = $this->actingAs($unrelatedUser)
            ->getJson("/api/orders/{$order->id}");

        $response->assertStatus(403);
    }

    public function test_owner_orders_lists_orders_for_business(): void
    {
        $customer = Customer::create([
            'business_id' => $this->business->id,
            'full_name' => 'John Doe',
            'phone' => '0712345678',
            'customer_code' => 'CTM-000001',
        ]);

        Order::create([
            'business_id' => $this->business->id,
            'customer_id' => $customer->id,
            'transaction_code' => Order::generateTransactionCode(),
            'subtotal' => 5000,
            'discount' => 0,
            'tax' => 0,
            'total' => 5000,
            'status' => 'pending',
            'payment_status' => 'unpaid',
        ]);

        Order::create([
            'business_id' => $this->business->id,
            'customer_id' => $customer->id,
            'transaction_code' => Order::generateTransactionCode(),
            'subtotal' => 3000,
            'discount' => 0,
            'tax' => 0,
            'total' => 3000,
            'status' => 'completed',
            'payment_status' => 'paid',
        ]);

        $response = $this->actingAs($this->owner)
            ->getJson('/api/owner/orders');

        $response->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_unauthenticated_users_cannot_access_orders(): void
    {
        $response = $this->getJson('/api/orders');

        $response->assertStatus(401);
    }

    public function test_cancel_order_restores_stock(): void
    {
        $product = Product::factory()->create([
            'business_id' => $this->business->id,
            'quantity' => 10,
            'selling_price' => 5000,
        ]);

        $customer = Customer::create([
            'business_id' => $this->business->id,
            'user_id' => $this->customerUser->id,
            'full_name' => 'John Doe',
            'phone' => '0712345678',
            'customer_code' => 'CTM-000001',
        ]);

        $order = Order::create([
            'business_id' => $this->business->id,
            'customer_id' => $customer->id,
            'transaction_code' => Order::generateTransactionCode(),
            'subtotal' => 10000,
            'discount' => 0,
            'tax' => 0,
            'total' => 10000,
            'status' => 'pending',
            'payment_status' => 'unpaid',
        ]);

        $order->items()->create([
            'product_id' => $product->id,
            'quantity' => 2,
            'unit_price' => 5000,
            'total_price' => 10000,
        ]);

        $product->decrement('quantity', 2);
        $this->assertEquals(8, $product->fresh()->quantity);

        $response = $this->actingAs($this->customerUser)
            ->postJson("/api/customer/orders/{$order->id}/cancel");

        $response->assertOk();

        $this->assertEquals(10, $product->fresh()->quantity);
        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'status' => 'cancelled',
        ]);
    }
}
