<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\Coupon;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CouponTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;
    private Business $business;

    protected function setUp(): void
    {
        parent::setUp();

        $this->owner = User::factory()->create(['role' => 'business_owner', 'is_active' => true]);
        $this->business = Business::factory()->create(['user_id' => $this->owner->id, 'status' => 'active']);
    }

    public function test_owner_can_create_coupon(): void
    {
        $this->actingAs($this->owner)
            ->postJson("/api/owner/businesses/{$this->business->id}/coupons", [
                'code' => 'SAVE10',
                'type' => 'percentage',
                'value' => 10,
                'min_order_amount' => 5000,
            ])
            ->assertStatus(201)
            ->assertJsonPath('coupon.code', 'SAVE10');

        $this->assertDatabaseHas('coupons', [
            'business_id' => $this->business->id,
            'code' => 'SAVE10',
            'type' => 'percentage',
            'value' => 10,
        ]);
    }

    public function test_owner_can_list_coupons(): void
    {
        Coupon::create([
            'business_id' => $this->business->id,
            'code' => 'SAVE10',
            'type' => 'percentage',
            'value' => 10,
        ]);
        Coupon::create([
            'business_id' => $this->business->id,
            'code' => 'SAVE20',
            'type' => 'fixed',
            'value' => 2000,
        ]);

        $this->actingAs($this->owner)
            ->getJson("/api/owner/businesses/{$this->business->id}/coupons")
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_non_owner_cannot_create_coupon(): void
    {
        $otherOwner = User::factory()->create(['role' => 'business_owner', 'is_active' => true]);

        $this->actingAs($otherOwner)
            ->postJson("/api/owner/businesses/{$this->business->id}/coupons", [
                'code' => 'SAVE10',
                'type' => 'percentage',
                'value' => 10,
            ])
            ->assertStatus(403);
    }

    public function test_owner_can_update_coupon(): void
    {
        $coupon = Coupon::create([
            'business_id' => $this->business->id,
            'code' => 'SAVE10',
            'type' => 'percentage',
            'value' => 10,
        ]);

        $this->actingAs($this->owner)
            ->putJson("/api/owner/businesses/{$this->business->id}/coupons/{$coupon->id}", [
                'value' => 15,
                'is_active' => false,
            ])
            ->assertOk()
            ->assertJsonPath('coupon.value', '15.00')
            ->assertJsonPath('coupon.is_active', false);
    }

    public function test_owner_can_delete_coupon(): void
    {
        $coupon = Coupon::create([
            'business_id' => $this->business->id,
            'code' => 'SAVE10',
            'type' => 'percentage',
            'value' => 10,
        ]);

        $this->actingAs($this->owner)
            ->deleteJson("/api/owner/businesses/{$this->business->id}/coupons/{$coupon->id}")
            ->assertOk();

        $this->assertDatabaseMissing('coupons', ['id' => $coupon->id]);
    }

    public function test_validate_valid_coupon_applies_discount(): void
    {
        Coupon::create([
            'business_id' => $this->business->id,
            'code' => 'SAVE10',
            'type' => 'percentage',
            'value' => 10,
            'min_order_amount' => 1000,
            'is_active' => true,
        ]);

        $this->actingAs($this->owner)
            ->postJson('/api/coupons/validate', [
                'code' => 'save10',
                'business_id' => $this->business->id,
                'order_amount' => 10000,
            ])
            ->assertOk()
            ->assertJsonPath('valid', true)
            ->assertJsonPath('discount', 1000);
    }

    public function test_validate_rejects_inactive_coupon(): void
    {
        Coupon::create([
            'business_id' => $this->business->id,
            'code' => 'SAVE10',
            'type' => 'percentage',
            'value' => 10,
            'is_active' => false,
        ]);

        $this->actingAs($this->owner)
            ->postJson('/api/coupons/validate', [
                'code' => 'SAVE10',
                'business_id' => $this->business->id,
                'order_amount' => 10000,
            ])
            ->assertStatus(422);
    }

    public function test_validate_rejects_unknown_coupon(): void
    {
        $this->actingAs($this->owner)
            ->postJson('/api/coupons/validate', [
                'code' => 'NOPE',
                'business_id' => $this->business->id,
                'order_amount' => 10000,
            ])
            ->assertStatus(404);
    }
}
