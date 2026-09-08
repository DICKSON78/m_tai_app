<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BusinessTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    protected function setUp(): void
    {
        parent::setUp();

        $this->owner = User::factory()->create(['role' => 'business_owner', 'is_active' => true]);
    }

    public function test_owner_can_create_business(): void
    {
        $this->actingAs($this->owner)
            ->postJson('/api/owner/businesses', [
                'business_name' => 'Duka Kubwa',
                'business_type' => 'retail',
                'business_category' => 'supermarket',
                'region' => 'Dar es Salaam',
                'district' => 'Ilala',
                'ward' => 'Kariakoo',
            ])
            ->assertStatus(201)
            ->assertJsonPath('business_name', 'Duka Kubwa')
            ->assertJsonPath('status', 'pending');

        $this->assertDatabaseHas('businesses', [
            'user_id' => $this->owner->id,
            'business_name' => 'Duka Kubwa',
        ]);
    }

    public function test_owner_can_list_businesses(): void
    {
        Business::factory()->create(['user_id' => $this->owner->id]);
        Business::factory()->create(['user_id' => $this->owner->id]);

        $this->actingAs($this->owner)
            ->getJson('/api/owner/businesses')
            ->assertOk()
            ->assertJsonCount(2);
    }

    public function test_owner_can_update_business(): void
    {
        $business = Business::factory()->create(['user_id' => $this->owner->id]);

        $this->actingAs($this->owner)
            ->putJson("/api/owner/businesses/{$business->id}", [
                'business_name' => 'Duka Jipya',
            ])
            ->assertOk()
            ->assertJsonPath('business_name', 'Duka Jipya');
    }

    public function test_non_owner_cannot_update_business(): void
    {
        $otherOwner = User::factory()->create(['role' => 'business_owner', 'is_active' => true]);
        $business = Business::factory()->create(['user_id' => $otherOwner->id]);

        $this->actingAs($this->owner)
            ->putJson("/api/owner/businesses/{$business->id}", ['business_name' => 'Hacked'])
            ->assertStatus(403);
    }

    public function test_owner_can_delete_business_without_orders(): void
    {
        $business = Business::factory()->create(['user_id' => $this->owner->id]);

        $this->actingAs($this->owner)
            ->deleteJson("/api/owner/businesses/{$business->id}")
            ->assertOk();

        $this->assertDatabaseMissing('businesses', ['id' => $business->id]);
    }

    public function test_owner_can_switch_to_active_business(): void
    {
        $business = Business::factory()->create(['user_id' => $this->owner->id, 'status' => 'active']);

        $this->actingAs($this->owner)
            ->postJson("/api/owner/businesses/{$business->id}/switch")
            ->assertOk()
            ->assertJsonPath('message', 'Umefanikiwa kubadilisha biashara.');
    }

    public function test_cannot_switch_to_pending_business(): void
    {
        $business = Business::factory()->create(['user_id' => $this->owner->id, 'status' => 'pending']);

        $this->actingAs($this->owner)
            ->postJson("/api/owner/businesses/{$business->id}/switch")
            ->assertStatus(422);
    }

    public function test_owner_can_add_capital(): void
    {
        $business = Business::factory()->create(['user_id' => $this->owner->id]);

        $this->actingAs($this->owner)
            ->postJson("/api/owner/businesses/{$business->id}/capitals", [
                'capital_amount' => 1000000,
                'source' => 'personal_savings',
                'registration_date' => now()->toDateString(),
            ])
            ->assertStatus(201)
            ->assertJsonPath('total_capital', 1000000);
    }

    public function test_owner_can_get_capitals(): void
    {
        $business = Business::factory()->create(['user_id' => $this->owner->id]);

        $this->actingAs($this->owner)
            ->getJson("/api/owner/businesses/{$business->id}/capitals")
            ->assertOk()
            ->assertJsonPath('total_capital', 0);
    }
}
