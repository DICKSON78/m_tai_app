<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\Customer;
use App\Models\Delivery;
use App\Models\Transporter;
use App\Models\User;
use App\Models\UserNotification;
use App\Services\DeliveryDispatchService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeliveryDispatchTest extends TestCase
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
            'full_name' => 'Dispatch Customer',
            'phone' => '0712345678',
            'customer_code' => 'CTM-000001',
        ]);
    }

    private function makeTransporter(
        string $name,
        float $latitude,
        float $longitude,
        bool $online = true,
        ?string $region = 'Dar es Salaam'
    ): array {
        $user = User::factory()->create(['role' => 'transporter', 'is_active' => true]);
        $transporter = Transporter::create([
            'user_id' => $user->id,
            'full_name' => $name,
            'phone' => '0755'.rand(100000, 999999),
            'vehicle_type' => 'motorcycle',
            'plate_number' => 'T'.rand(100, 999).'ABC',
            'is_active' => true,
            'is_online' => $online,
            'latitude' => $latitude,
            'longitude' => $longitude,
            'region' => $region,
        ]);

        return [$user, $transporter];
    }

    private function createDelivery(array $extra = []): Delivery
    {
        return Delivery::create(array_merge([
            'business_id' => $this->business->id,
            'customer_id' => $this->customer->id,
            'goods_category' => 'sealed',
            'item_description' => 'Dispatch test item',
            'quantity' => 1,
            'pickup_location' => 'Kariakoo, Dar es Salaam',
            'destination' => 'Arusha',
            'offered_price' => 25000,
            'status' => 'pending',
            'pickup_latitude' => -6.8220,
            'pickup_longitude' => 39.2860,
        ], $extra));
    }

    public function test_nearest_online_transporter_is_offered_the_load(): void
    {
        [, $near] = $this->makeTransporter('Near Driver', -6.8230, 39.2870);
        [$farUser, $far] = $this->makeTransporter('Far Driver', -3.3869, 36.6830);

        $service = app(DeliveryDispatchService::class);
        $delivery = $this->createDelivery();

        $this->assertTrue($service->offer($delivery));

        $this->assertDatabaseHas('deliveries', [
            'id' => $delivery->id,
            'transporter_id' => $near->id,
            'status' => 'pending',
            'auto_dispatched' => true,
        ]);
        $this->assertNotNull($delivery->fresh()->offer_expires_at);
        $this->assertTrue(UserNotification::where('user_id', $near->user_id)->exists());
        $this->assertFalse(UserNotification::where('user_id', $farUser->id)->exists());
    }

    public function test_offline_and_distant_transporters_are_not_offered(): void
    {
        $this->makeTransporter('Offline Driver', -6.8230, 39.2870, false);
        $this->makeTransporter('Distant Driver', -3.3869, 36.6830);

        $delivery = $this->createDelivery();

        $this->assertFalse(app(DeliveryDispatchService::class)->offer($delivery));
        $this->assertNull($delivery->fresh()->transporter_id);
    }

    public function test_creating_delivery_auto_offers_to_nearest_driver(): void
    {
        [, $near] = $this->makeTransporter('Near Driver', -6.8230, 39.2870);

        $response = $this->actingAs($this->owner)
            ->postJson("/api/owner/businesses/{$this->business->id}/deliveries", [
                'customer_id' => $this->customer->id,
                'goods_category' => 'sealed',
                'item_description' => 'Auto dispatch item',
                'quantity' => 1,
                'pickup_location' => 'Kariakoo',
                'destination' => 'Arusha',
                'offered_price' => 25000,
                'pickup_latitude' => -6.8220,
                'pickup_longitude' => 39.2860,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('offered', true)
            ->assertJsonPath('delivery.transporter_id', $near->id)
            ->assertJsonPath('delivery.status', 'pending');
    }

    public function test_only_offered_transporter_sees_the_request(): void
    {
        [$offeredUser, $transporter] = $this->makeTransporter('Offered Driver', -6.8230, 39.2870);
        [$otherUser] = $this->makeTransporter('Other Driver', -6.8240, 39.2880);
        $delivery = $this->createDelivery();
        app(DeliveryDispatchService::class)->offer($delivery, [], $transporter);

        $this->actingAs($offeredUser)
            ->getJson('/api/transporter/deliveries/offers')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $delivery->id);

        $this->actingAs($otherUser)
            ->getJson('/api/transporter/deliveries/offers')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_offered_transporter_can_accept_and_other_cannot(): void
    {
        [$offeredUser, $transporter] = $this->makeTransporter('Offered Driver', -6.8230, 39.2870);
        [$otherUser] = $this->makeTransporter('Other Driver', -6.8240, 39.2880);
        $delivery = $this->createDelivery();
        app(DeliveryDispatchService::class)->offer($delivery, [], $transporter);

        $this->actingAs($otherUser)
            ->postJson("/api/transporter/deliveries/{$delivery->id}/accept")
            ->assertStatus(422);

        $this->actingAs($offeredUser)
            ->postJson("/api/transporter/deliveries/{$delivery->id}/accept")
            ->assertOk()
            ->assertJsonPath('delivery.status', 'accepted');

        $this->assertDatabaseHas('deliveries', [
            'id' => $delivery->id,
            'transporter_id' => $transporter->id,
            'status' => 'accepted',
        ]);
        $this->assertNotNull($delivery->fresh()->accepted_at);
    }

    public function test_rejecting_releases_offer_and_reoffers_next_nearest_driver(): void
    {
        [$firstUser, $first] = $this->makeTransporter('First Driver', -6.8230, 39.2870);
        [, $second] = $this->makeTransporter('Second Driver', -6.8260, 39.2900);
        $delivery = $this->createDelivery();
        app(DeliveryDispatchService::class)->offer($delivery);

        $this->assertEquals($first->id, $delivery->fresh()->transporter_id);

        $response = $this->actingAs($firstUser)
            ->postJson("/api/transporter/deliveries/{$delivery->id}/reject", ['reason' => 'Njiani']);

        $response->assertOk()->assertJsonPath('reoffered', true);
        $this->assertEquals($second->id, $delivery->fresh()->transporter_id);
        $this->assertEquals('pending', $delivery->fresh()->status);
    }

    public function test_expired_offer_is_released_and_available_again(): void
    {
        [$user, $transporter] = $this->makeTransporter('Driver', -6.8230, 39.2870);
        $delivery = $this->createDelivery([
            'transporter_id' => $transporter->id,
            'status' => 'pending',
            'offered_at' => now()->subMinutes(5),
            'offer_expires_at' => now()->subMinute(),
            'auto_dispatched' => true,
        ]);

        $this->actingAs($user)
            ->getJson('/api/transporter/deliveries/available')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->assertNull($delivery->fresh()->transporter_id);
        $this->assertNull($delivery->fresh()->offer_expires_at);
    }

    public function test_expired_offer_is_reoffered_to_next_nearest_driver(): void
    {
        [$firstUser, $first] = $this->makeTransporter('First Driver', -6.8230, 39.2870);
        [, $second] = $this->makeTransporter('Second Driver', -6.8260, 39.2900);
        $delivery = $this->createDelivery([
            'transporter_id' => $first->id,
            'status' => 'pending',
            'offered_at' => now()->subMinutes(5),
            'offer_expires_at' => now()->subMinute(),
            'auto_dispatched' => true,
        ]);

        $this->actingAs($firstUser)
            ->getJson('/api/transporter/deliveries/available')
            ->assertOk();

        $this->assertEquals($second->id, $delivery->fresh()->transporter_id);
        $this->assertEquals('pending', $delivery->fresh()->status);
        $this->assertTrue($delivery->fresh()->offer_expires_at->isFuture());
    }

    public function test_driver_receives_waiting_load_when_coming_online(): void
    {
        [$user, $transporter] = $this->makeTransporter(
            'Returning Driver',
            -6.8230,
            39.2870,
            false
        );
        $delivery = $this->createDelivery();

        $this->assertNull($delivery->fresh()->transporter_id);

        $this->actingAs($user)
            ->putJson('/api/transporter/availability', ['is_online' => true])
            ->assertOk()
            ->assertJsonPath('is_online', true);

        $this->assertEquals($transporter->id, $delivery->fresh()->transporter_id);
        $this->assertEquals('pending', $delivery->fresh()->status);
        $this->assertTrue($delivery->fresh()->auto_dispatched);
    }

    public function test_active_offer_is_hidden_from_available_pool(): void
    {
        [, $transporter] = $this->makeTransporter('Busy Driver', -6.8230, 39.2870);
        $delivery = $this->createDelivery();
        app(DeliveryDispatchService::class)->offer($delivery, [], $transporter);

        $driverUser = $transporter->user;
        $this->actingAs($driverUser)
            ->getJson('/api/transporter/deliveries/available')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_transporter_can_report_location_and_toggle_availability(): void
    {
        [$user] = $this->makeTransporter('Driver', -6.8230, 39.2870);

        $this->actingAs($user)
            ->postJson('/api/transporter/location', [
                'latitude' => -6.9000,
                'longitude' => 39.3000,
            ])
            ->assertOk()
            ->assertJsonPath('is_online', true);

        $transporter = $user->fresh()->transporter;
        $this->assertEquals(-6.9000, $transporter->latitude);
        $this->assertNotNull($transporter->last_location_at);

        $this->actingAs($user)
            ->putJson('/api/transporter/availability', ['is_online' => false])
            ->assertOk()
            ->assertJsonPath('is_online', false)
            ->assertJsonPath('is_available', false);

        $this->assertFalse($user->fresh()->transporter->is_online);
    }

    public function test_profile_returns_flat_fields_for_mobile(): void
    {
        [$user] = $this->makeTransporter('Driver', -6.8230, 39.2870);

        $this->actingAs($user)
            ->getJson('/api/transporter/profile')
            ->assertOk()
            ->assertJsonPath('vehicle_type', 'motorcycle')
            ->assertJsonPath('is_available', true)
            ->assertJsonPath('is_online', true)
            ->assertJsonStructure(['transporter', 'vehicle_plate', 'region']);
    }

    public function test_region_fallback_when_pickup_has_no_coordinates(): void
    {
        [, $regional] = $this->makeTransporter('Regional Driver', -3.3869, 36.6830, true, 'Dar es Salaam');
        $delivery = $this->createDelivery([
            'pickup_latitude' => null,
            'pickup_longitude' => null,
        ]);

        app(DeliveryDispatchService::class)->offer($delivery);

        $this->assertEquals($regional->id, $delivery->fresh()->transporter_id);
    }
}
