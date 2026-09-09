<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CheckoutTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_can_checkout_with_session_cart(): void
    {
        $owner = User::factory()->create(['role' => 'business_owner', 'is_active' => true]);
        $business = Business::factory()->create(['user_id' => $owner->id, 'status' => 'active', 'is_published' => true]);
        $product = Product::factory()->create([
            'business_id' => $business->id,
            'is_published' => true,
            'is_draft' => false,
            'quantity' => 10,
            'selling_price' => 3500,
        ]);

        $response = $this->actingAs(User::factory()->create(['role' => 'customer', 'is_active' => true]))
            ->withSession(['cart' => [['product_id' => $product->id, 'quantity' => 2]]])
            ->postJson('/api/orders/checkout', [
                'customer_name' => 'E2E Buyer',
                'customer_phone' => '0712345678',
                'payment_method' => 'mobile_money',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('total_orders', 1);

        $order = Order::first();
        $this->assertNotNull($order);
        $this->assertEquals('pending', $order->status);
        $this->assertEquals(7000.00, (float) $order->total);
        $this->assertEquals(1, $order->items()->count());
        $this->assertEquals(8, $product->fresh()->quantity);
        $this->assertTrue($order->payments()->where('method', 'mobile_money')->exists());
        $this->assertDatabaseHas('customers', ['phone' => '0712345678']);

        $this->assertNull($this->app['session']->get('cart'));
    }
}