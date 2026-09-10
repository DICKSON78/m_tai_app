<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\Customer;
use App\Models\Delivery;
use App\Models\Order;
use App\Models\Transporter;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeliveryTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;
    private Business $business;
    private Customer $customer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->owner = User::factory()->create(['role' => 'business_owner', 'is_active' => true]);
        $this->business = Business::factory()->create(['user_id' => $this->owner->id]);

        $this->customer = Customer::create([
            'business_id' => $this->business->id,
            'full_name' => 'Test Customer',
            'phone' => '0712345678',
            'customer_code' => 'CTM-000001',
        ]);
    }

    public function test_owner_can_create_delivery(): void
    {
        $response = $this->actingAs($this->owner)
            ->postJson("/api/owner/businesses/{$this->business->id}/deliveries", [
                'customer_id' => $this->customer->id,
                'goods_category' => 'sealed',
                'item_description' => 'Laptop and accessories',
                'quantity' => 2,
                'pickup_location' => 'Kariakoo, Dar es Salaam',
                'destination' => 'Arusha, Tanzania',
                'offered_price' => 50000,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('message', 'Ofa ya usafirishaji imetolewa.');

        $this->assertDatabaseHas('deliveries', [
            'business_id' => $this->business->id,
            'customer_id' => $this->customer->id,
            'status' => 'pending',
        ]);
    }

    public function test_owner_can_create_delivery_linked_to_an_order(): void
    {
        $order = Order::create([
            'business_id' => $this->business->id,
            'customer_id' => $this->customer->id,
            'transaction_code' => 'TXN-100000001',
            'subtotal' => 50000,
            'total' => 50000,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->owner)
            ->postJson("/api/owner/businesses/{$this->business->id}/deliveries", [
                'customer_id' => $this->customer->id,
                'order_id' => $order->id,
                'goods_category' => 'sealed',
                'item_description' => 'Laptop and accessories',
                'quantity' => 2,
                'pickup_location' => 'Kariakoo',
                'destination' => 'Arusha',
                'offered_price' => 50000,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('delivery.order_id', $order->id)
            ->assertJsonPath('delivery.order.transaction_code', 'TXN-100000001');

        $this->assertDatabaseHas('deliveries', [
            'business_id' => $this->business->id,
            'order_id' => $order->id,
        ]);
    }

    public function test_order_from_another_customer_is_rejected_on_delivery_create(): void
    {
        $otherCustomer = Customer::create([
            'business_id' => $this->business->id,
            'full_name' => 'Other Customer',
            'phone' => '0799888777',
            'customer_code' => 'CTM-000002',
        ]);

        $order = Order::create([
            'business_id' => $this->business->id,
            'customer_id' => $otherCustomer->id,
            'transaction_code' => 'TXN-100000999',
            'subtotal' => 10000,
            'total' => 10000,
            'status' => 'pending',
        ]);

        $this->actingAs($this->owner)
            ->postJson("/api/owner/businesses/{$this->business->id}/deliveries", [
                'customer_id' => $this->customer->id,
                'order_id' => $order->id,
                'goods_category' => 'sealed',
                'item_description' => 'Item',
                'quantity' => 1,
                'pickup_location' => 'Dar',
                'destination' => 'Arusha',
                'offered_price' => 10000,
            ])
            ->assertStatus(422);
    }

    public function test_owner_can_list_deliveries(): void
    {
        Delivery::create([
            'business_id' => $this->business->id,
            'customer_id' => $this->customer->id,
            'goods_category' => 'sealed',
            'item_description' => 'Item 1',
            'quantity' => 1,
            'pickup_location' => 'Dar',
            'destination' => 'Arusha',
            'offered_price' => 10000,
        ]);
        Delivery::create([
            'business_id' => $this->business->id,
            'customer_id' => $this->customer->id,
            'goods_category' => 'loose',
            'item_description' => 'Item 2',
            'quantity' => 2,
            'pickup_location' => 'Dar',
            'destination' => 'Mwanza',
            'offered_price' => 20000,
        ]);
        Delivery::create([
            'business_id' => $this->business->id,
            'customer_id' => $this->customer->id,
            'goods_category' => 'listed',
            'item_description' => 'Item 3',
            'quantity' => 3,
            'pickup_location' => 'Dar',
            'destination' => 'Dodoma',
            'offered_price' => 30000,
        ]);

        $response = $this->actingAs($this->owner)
            ->getJson("/api/owner/businesses/{$this->business->id}/deliveries");

        $response->assertOk()
            ->assertJsonCount(3, 'data');
    }

    public function test_owner_can_update_delivery_status(): void
    {
        $delivery = Delivery::create([
            'business_id' => $this->business->id,
            'customer_id' => $this->customer->id,
            'goods_category' => 'sealed',
            'item_description' => 'Test item',
            'quantity' => 1,
            'pickup_location' => 'Dar',
            'destination' => 'Arusha',
            'offered_price' => 10000,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->owner)
            ->postJson("/api/owner/businesses/{$this->business->id}/deliveries/{$delivery->id}/status", [
                'status' => 'accepted',
            ]);

        $response->assertOk()
            ->assertJsonPath('delivery.status', 'accepted');
    }

    public function test_invalid_status_transition_returns_422(): void
    {
        $delivery = Delivery::create([
            'business_id' => $this->business->id,
            'customer_id' => $this->customer->id,
            'goods_category' => 'sealed',
            'item_description' => 'Test item',
            'quantity' => 1,
            'pickup_location' => 'Dar',
            'destination' => 'Arusha',
            'offered_price' => 10000,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->owner)
            ->postJson("/api/owner/businesses/{$this->business->id}/deliveries/{$delivery->id}/status", [
                'status' => 'delivered',
            ]);

        $response->assertStatus(422);
    }

    public function test_owner_can_list_active_transporters(): void
    {
        $active = Transporter::create([
            'user_id' => null,
            'full_name' => 'Active Rider',
            'phone' => '0711000000',
            'vehicle_type' => 'motorcycle',
            'plate_number' => 'TZ 1000',
            'is_active' => true,
        ]);

        Transporter::create([
            'user_id' => null,
            'full_name' => 'Inactive Rider',
            'phone' => '0711000001',
            'vehicle_type' => 'bicycle',
            'plate_number' => 'TZ 1001',
            'is_active' => false,
        ]);

        $response = $this->actingAs($this->owner)
            ->getJson("/api/owner/businesses/{$this->business->id}/transporters");

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $active->id)
            ->assertJsonPath('data.0.full_name', 'Active Rider');
    }

    public function test_transporter_can_list_their_assigned_deliveries(): void
    {
        $transporterUser = User::factory()->create(['role' => 'transporter', 'is_active' => true]);
        $transporter = Transporter::create([
            'user_id' => $transporterUser->id,
            'full_name' => 'Driver One',
            'phone' => '0755000000',
            'vehicle_type' => 'Bajaj',
            'plate_number' => 'T123ABC',
            'is_active' => true,
        ]);

        Delivery::create([
            'business_id' => $this->business->id,
            'customer_id' => $this->customer->id,
            'goods_category' => 'sealed',
            'item_description' => 'Assigned item',
            'quantity' => 1,
            'pickup_location' => 'Dar',
            'destination' => 'Arusha',
            'offered_price' => 10000,
            'status' => 'accepted',
            'transporter_id' => $transporter->id,
        ]);

        $response = $this->actingAs($transporterUser)
            ->getJson('/api/transporter/deliveries');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.status', 'accepted');
    }

    public function test_transporter_can_update_delivery_status(): void
    {
        $transporterUser = User::factory()->create(['role' => 'transporter', 'is_active' => true]);
        $transporter = Transporter::create([
            'user_id' => $transporterUser->id,
            'full_name' => 'Driver One',
            'phone' => '0755000000',
            'vehicle_type' => 'Bajaj',
            'plate_number' => 'T123ABC',
            'is_active' => true,
        ]);

        $delivery = Delivery::create([
            'business_id' => $this->business->id,
            'customer_id' => $this->customer->id,
            'goods_category' => 'sealed',
            'item_description' => 'Test item',
            'quantity' => 1,
            'pickup_location' => 'Dar',
            'destination' => 'Arusha',
            'offered_price' => 10000,
            'status' => 'accepted',
            'transporter_id' => $transporter->id,
        ]);

        $response = $this->actingAs($transporterUser)
            ->postJson("/api/transporter/deliveries/{$delivery->id}/status", [
                'status' => 'in_transit',
            ]);

        $response->assertOk()
            ->assertJsonPath('delivery.status', 'in_transit');
    }

    public function test_transporter_can_see_available_deliveries(): void
    {
        $transporterUser = User::factory()->create(['role' => 'transporter', 'is_active' => true]);
        Transporter::create([
            'user_id' => $transporterUser->id,
            'full_name' => 'Driver One',
            'phone' => '0755000000',
            'vehicle_type' => 'Bajaj',
            'plate_number' => 'T123ABC',
            'is_active' => true,
        ]);

        Delivery::create([
            'business_id' => $this->business->id,
            'customer_id' => $this->customer->id,
            'goods_category' => 'sealed',
            'item_description' => 'Available item',
            'quantity' => 1,
            'pickup_location' => 'Dar',
            'destination' => 'Arusha',
            'offered_price' => 10000,
            'status' => 'pending',
            'transporter_id' => null,
        ]);

        Delivery::create([
            'business_id' => $this->business->id,
            'customer_id' => $this->customer->id,
            'goods_category' => 'loose',
            'item_description' => 'Already accepted',
            'quantity' => 2,
            'pickup_location' => 'Dar',
            'destination' => 'Mwanza',
            'offered_price' => 20000,
            'status' => 'accepted',
        ]);

        $response = $this->actingAs($transporterUser)
            ->getJson('/api/transporter/deliveries/available');

        $response->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_unauthenticated_user_cannot_access_deliveries(): void
    {
        $response = $this->getJson("/api/owner/businesses/{$this->business->id}/deliveries");

        $response->assertStatus(401);
    }

    public function test_non_owner_cannot_create_delivery(): void
    {
        $otherOwner = User::factory()->create(['role' => 'business_owner', 'is_active' => true]);
        $otherBusiness = Business::factory()->create(['user_id' => $otherOwner->id]);

        $response = $this->actingAs($this->owner)
            ->postJson("/api/owner/businesses/{$otherBusiness->id}/deliveries", [
                'customer_id' => $this->customer->id,
                'goods_category' => 'Food',
                'item_description' => 'Rice bags',
                'quantity' => 10,
                'pickup_location' => 'Dar',
                'destination' => 'Mwanza',
                'offered_price' => 30000,
            ]);

        $response->assertStatus(403);
    }
}
