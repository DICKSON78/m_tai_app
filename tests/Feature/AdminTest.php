<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\Coupon;
use App\Models\Customer;
use App\Models\Order;
use App\Models\PlatformNotification;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
    }

    private function createOwner(): User
    {
        return User::factory()->create(['role' => 'business_owner', 'is_active' => true]);
    }

    private function createBusiness(User $owner, array $attrs = []): Business
    {
        return Business::factory()->create(array_merge(['user_id' => $owner->id], $attrs));
    }

    private function createCustomerFor(Business $business): Customer
    {
        return Customer::create([
            'business_id' => $business->id,
            'customer_code' => Customer::generateCustomerCode(),
            'full_name' => 'Juma Ally',
            'phone' => '0761111111',
            'is_guest' => false,
        ]);
    }

    private function createOrder(Business $business, Customer $customer): Order
    {
        return Order::create([
            'business_id' => $business->id,
            'customer_id' => $customer->id,
            'transaction_code' => 'TXN-' . strtoupper(\Illuminate\Support\Str::random(8)),
            'subtotal' => 50000,
            'discount' => 0,
            'tax' => 0,
            'total' => 50000,
            'status' => 'pending',
            'payment_status' => 'unpaid',
        ]);
    }

    public function test_unauthenticated_api_request_returns_401_not_500(): void
    {
        $this->get('/api/admin/businesses')
            ->assertStatus(401);
    }

    public function test_login_route_serves_spa(): void
    {
        $this->get(route('login'))
            ->assertStatus(200)
            ->assertSee('<div id="app"', escape: false);
    }

    public function test_non_admin_cannot_access_admin_routes(): void
    {
        $owner = $this->createOwner();

        $this->actingAs($owner)
            ->getJson('/api/admin/businesses')
            ->assertStatus(403);
    }

    public function test_admin_can_list_businesses(): void
    {
        $owner = $this->createOwner();
        $this->createBusiness($owner);
        $this->createBusiness($owner, ['business_name' => 'Duka Pili']);

        $this->actingAs($this->admin)
            ->getJson('/api/admin/businesses')
            ->assertOk()
            ->assertJsonPath('total', 2)
            ->assertJsonCount(2, 'data');
    }

    public function test_admin_can_show_business(): void
    {
        $business = $this->createBusiness($this->createOwner());

        $this->actingAs($this->admin)
            ->getJson("/api/admin/businesses/{$business->id}")
            ->assertOk()
            ->assertJsonPath('business_name', $business->business_name);
    }

    public function test_admin_can_create_business(): void
    {
        $owner = $this->createOwner();

        $this->actingAs($this->admin)
            ->postJson('/api/admin/businesses', [
                'business_name' => 'Duka Kubwa',
                'business_type' => 'retail',
                'business_category' => 'supermarket',
                'region' => 'Dar es Salaam',
                'district' => 'Ilala',
                'user_id' => $owner->id,
            ])
            ->assertStatus(201)
            ->assertJsonPath('business.business_name', 'Duka Kubwa')
            ->assertJsonPath('business.status', 'active');
    }

    public function test_admin_can_update_business(): void
    {
        $business = $this->createBusiness($this->createOwner());

        $this->actingAs($this->admin)
            ->putJson("/api/admin/businesses/{$business->id}", [
                'business_name' => 'Duka Lililobadilishwa',
            ])
            ->assertOk()
            ->assertJsonPath('business.business_name', 'Duka Lililobadilishwa');
    }

    public function test_admin_can_delete_business(): void
    {
        $business = $this->createBusiness($this->createOwner());

        $this->actingAs($this->admin)
            ->deleteJson("/api/admin/businesses/{$business->id}")
            ->assertOk();

        $this->assertDatabaseMissing('businesses', ['id' => $business->id]);
    }

    public function test_admin_can_verify_pending_shop(): void
    {
        $business = $this->createBusiness($this->createOwner(), ['status' => 'pending']);

        $this->actingAs($this->admin)
            ->postJson("/api/admin/businesses/{$business->id}/verify")
            ->assertOk()
            ->assertJsonPath('business.status', 'active')
            ->assertJsonPath('business.verified_at', fn ($v) => $v !== null);
    }

    public function test_cannot_verify_shop_not_pending(): void
    {
        $business = $this->createBusiness($this->createOwner(), ['status' => 'active']);

        $this->actingAs($this->admin)
            ->postJson("/api/admin/businesses/{$business->id}/verify")
            ->assertStatus(422);
    }

    public function test_admin_can_suspend_shop(): void
    {
        $business = $this->createBusiness($this->createOwner(), ['status' => 'active']);

        $this->actingAs($this->admin)
            ->postJson("/api/admin/businesses/{$business->id}/suspend", [
                'reason' => 'Ukiukaji',
            ])
            ->assertOk()
            ->assertJsonPath('business.status', 'suspended')
            ->assertJsonPath('business.suspension_reason', 'Ukiukaji');
    }

    public function test_admin_can_reactivate_suspended_shop(): void
    {
        $business = $this->createBusiness($this->createOwner(), ['status' => 'suspended', 'suspension_reason' => 'x']);

        $this->actingAs($this->admin)
            ->postJson("/api/admin/businesses/{$business->id}/reactivate")
            ->assertOk()
            ->assertJsonPath('business.status', 'active')
            ->assertJsonPath('business.suspension_reason', null);
    }

    public function test_admin_can_close_shop(): void
    {
        $business = $this->createBusiness($this->createOwner(), ['status' => 'active']);

        $this->actingAs($this->admin)
            ->postJson("/api/admin/businesses/{$business->id}/close")
            ->assertOk()
            ->assertJsonPath('business.status', 'closed');
    }

    public function test_admin_can_list_users(): void
    {
        $this->createOwner();
        User::factory()->create(['role' => 'customer', 'is_active' => true]);

        $this->actingAs($this->admin)
            ->getJson('/api/admin/users')
            ->assertOk()
            ->assertJsonPath('total', 3)
            ->assertJsonCount(3, 'data');
    }

    public function test_admin_can_create_user(): void
    {
        $this->actingAs($this->admin)
            ->postJson('/api/admin/users', [
                'name' => 'Mfanyakazi Mpya',
                'email' => 'new@example.com',
                'phone' => '0712345678',
                'password' => 'password123',
                'role' => 'business_owner',
            ])
            ->assertStatus(201)
            ->assertJsonPath('user.name', 'Mfanyakazi Mpya')
            ->assertJsonPath('user.email', 'new@example.com');

        $this->assertDatabaseHas('users', ['email' => 'new@example.com', 'role' => 'business_owner']);
    }

    public function test_admin_can_update_user(): void
    {
        $user = $this->createOwner();

        $this->actingAs($this->admin)
            ->putJson("/api/admin/users/{$user->id}", [
                'name' => 'Jina Jipya',
            ])
            ->assertOk()
            ->assertJsonPath('user.name', 'Jina Jipya');
    }

    public function test_admin_can_delete_user(): void
    {
        $user = $this->createOwner();

        $this->actingAs($this->admin)
            ->deleteJson("/api/admin/users/{$user->id}")
            ->assertOk();

        $this->assertDatabaseMissing('users', ['id' => $user->id]);
    }

    public function test_admin_can_list_orders(): void
    {
        $business = $this->createBusiness($this->createOwner());
        $customer = $this->createCustomerFor($business);
        $this->createOrder($business, $customer);

        $this->actingAs($this->admin)
            ->getJson('/api/admin/orders')
            ->assertOk()
            ->assertJsonPath('total', 1)
            ->assertJsonPath('summary.total', 1);
    }

    public function test_admin_can_show_order(): void
    {
        $business = $this->createBusiness($this->createOwner());
        $customer = $this->createCustomerFor($business);
        $order = $this->createOrder($business, $customer);

        $this->actingAs($this->admin)
            ->getJson("/api/admin/orders/{$order->id}")
            ->assertOk()
            ->assertJsonPath('transaction_code', $order->transaction_code);
    }

    public function test_admin_can_update_order(): void
    {
        $business = $this->createBusiness($this->createOwner());
        $customer = $this->createCustomerFor($business);
        $order = $this->createOrder($business, $customer);

        $this->actingAs($this->admin)
            ->putJson("/api/admin/orders/{$order->id}", [
                'status' => 'confirmed',
                'payment_status' => 'paid',
            ])
            ->assertOk()
            ->assertJsonPath('order.status', 'confirmed')
            ->assertJsonPath('order.payment_status', 'paid');
    }

    public function test_admin_can_delete_order(): void
    {
        $business = $this->createBusiness($this->createOwner());
        $customer = $this->createCustomerFor($business);
        $order = $this->createOrder($business, $customer);

        $this->actingAs($this->admin)
            ->deleteJson("/api/admin/orders/{$order->id}")
            ->assertOk();

        $this->assertDatabaseMissing('orders', ['id' => $order->id]);
    }

    public function test_admin_can_list_subscriptions(): void
    {
        $business = $this->createBusiness($this->createOwner());

        Subscription::create([
            'business_id' => $business->id,
            'plan' => 'monthly',
            'amount' => 30000,
            'status' => 'active',
            'start_date' => now()->toDateString(),
            'end_date' => now()->addMonth()->toDateString(),
        ]);

        $this->actingAs($this->admin)
            ->getJson('/api/admin/subscriptions')
            ->assertOk()
            ->assertJsonPath('total', 1);
    }

    public function test_admin_can_create_subscription(): void
    {
        $business = $this->createBusiness($this->createOwner());

        $this->actingAs($this->admin)
            ->postJson('/api/admin/subscriptions', [
                'business_id' => $business->id,
                'plan' => 'monthly',
                'amount' => 50000,
            ])
            ->assertStatus(201)
            ->assertJsonPath('subscription.plan', 'monthly')
            ->assertJsonPath('subscription.status', 'active');
    }

    public function test_admin_can_create_announcement(): void
    {
        $this->actingAs($this->admin)
            ->postJson('/api/admin/announcements', [
                'title' => 'Tangazo',
                'message' => 'Habari za mfumo',
                'type' => 'update',
                'target' => 'all',
            ])
            ->assertStatus(201)
            ->assertJsonPath('announcement.title', 'Tangazo')
            ->assertJsonPath('announcement.sent_by', $this->admin->id);

        $this->assertDatabaseHas('platform_notifications', [
            'title' => 'Tangazo',
            'sent_by' => $this->admin->id,
        ]);
    }

    public function test_admin_can_list_announcements(): void
    {
        PlatformNotification::create([
            'title' => 'Tangazo',
            'message' => 'Habari',
            'type' => 'update',
            'target' => 'all',
            'sent_by' => $this->admin->id,
        ]);

        $this->actingAs($this->admin)
            ->getJson('/api/admin/announcements')
            ->assertOk()
            ->assertJsonPath('total', 1);
    }

    public function test_admin_can_update_announcement(): void
    {
        $announcement = PlatformNotification::create([
            'title' => 'Tangazo',
            'message' => 'Habari',
            'type' => 'update',
            'target' => 'all',
            'sent_by' => $this->admin->id,
        ]);

        $this->actingAs($this->admin)
            ->putJson("/api/admin/announcements/{$announcement->id}", [
                'title' => 'Tangazo Jipya',
            ])
            ->assertOk()
            ->assertJsonPath('announcement.title', 'Tangazo Jipya');
    }

    public function test_admin_can_delete_announcement(): void
    {
        $announcement = PlatformNotification::create([
            'title' => 'Tangazo',
            'message' => 'Habari',
            'type' => 'update',
            'target' => 'all',
            'sent_by' => $this->admin->id,
        ]);

        $this->actingAs($this->admin)
            ->deleteJson("/api/admin/announcements/{$announcement->id}")
            ->assertOk();

        $this->assertDatabaseMissing('platform_notifications', ['id' => $announcement->id]);
    }

    public function test_admin_can_list_coupons(): void
    {
        $business = $this->createBusiness($this->createOwner());

        Coupon::create([
            'business_id' => $business->id,
            'code' => 'PROMO20',
            'type' => 'percentage',
            'value' => 20,
        ]);

        $this->actingAs($this->admin)
            ->getJson('/api/admin/coupons')
            ->assertOk()
            ->assertJsonPath('total', 1);
    }

    public function test_admin_can_get_settings(): void
    {
        $this->actingAs($this->admin)
            ->getJson('/api/admin/settings')
            ->assertOk()
            ->assertJsonPath('app_name', 'M-TAI')
            ->assertJsonPath('currency', 'TZS');
    }

    public function test_admin_can_update_settings(): void
    {
        $this->actingAs($this->admin)
            ->putJson('/api/admin/settings', [
                'app_name' => 'M-TAI Pro',
                'maintenance_mode' => true,
            ])
            ->assertOk()
            ->assertJsonPath('settings.app_name', 'M-TAI Pro')
            ->assertJsonPath('settings.maintenance_mode', true);
    }
}
