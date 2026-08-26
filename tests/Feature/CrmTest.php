<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\Lead;
use App\Models\CrmDeal;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CrmTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;
    private Business $business;

    protected function setUp(): void
    {
        parent::setUp();
        $this->owner = User::factory()->create(['role' => 'business_owner', 'is_active' => true]);
        $this->business = Business::factory()->create(['user_id' => $this->owner->id]);
        $this->owner->update(['current_business_id' => $this->business->id]);
    }

    public function test_list_leads(): void
    {
        Lead::create([
            'business_id' => $this->business->id,
            'name' => 'Acme Corp',
            'email' => 'info@acme.com',
            'status' => 'new',
            'source' => 'website',
        ]);
        Lead::create([
            'business_id' => $this->business->id,
            'name' => 'Beta Inc',
            'email' => 'contact@beta.com',
            'status' => 'contacted',
            'source' => 'referral',
        ]);

        $response = $this->actingAs($this->owner)
            ->getJson('/api/owner/crm/leads');

        $response->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_create_lead(): void
    {
        $response = $this->actingAs($this->owner)
            ->postJson('/api/owner/crm/leads', [
                'name' => 'Acme Corp',
                'email' => 'info@acme.com',
                'phone' => '+255700000000',
                'company' => 'Acme Corporation',
                'source' => 'website',
                'estimated_value' => 1500000,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('name', 'Acme Corp')
            ->assertJsonPath('status', 'new');

        $this->assertDatabaseHas('crm_leads', [
            'business_id' => $this->business->id,
            'name' => 'Acme Corp',
        ]);
    }

    public function test_list_deals(): void
    {
        $lead = Lead::create([
            'business_id' => $this->business->id,
            'name' => 'Acme Corp',
            'status' => 'new',
        ]);
        CrmDeal::create([
            'business_id' => $this->business->id,
            'lead_id' => $lead->id,
            'title' => 'Big Deal',
            'amount' => 5000000,
            'stage' => 'prospecting',
        ]);

        $response = $this->actingAs($this->owner)
            ->getJson('/api/owner/crm/deals');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Big Deal');
    }

    public function test_create_deal(): void
    {
        $response = $this->actingAs($this->owner)
            ->postJson('/api/owner/crm/deals', [
                'title' => 'Big Deal',
                'amount' => 5000000,
                'stage' => 'prospecting',
                'expected_close_date' => '2026-06-30',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('title', 'Big Deal')
            ->assertJsonPath('stage', 'prospecting');

        $this->assertDatabaseHas('crm_deals', [
            'business_id' => $this->business->id,
            'title' => 'Big Deal',
        ]);
    }

    public function test_unauthenticated_user_cannot_access_crm(): void
    {
        $response = $this->getJson('/api/owner/crm/leads');

        $response->assertStatus(401);
    }

    public function test_non_owner_cannot_access_crm(): void
    {
        $customer = User::factory()->create(['role' => 'customer', 'is_active' => true]);

        $response = $this->actingAs($customer)
            ->getJson('/api/owner/crm/leads');

        $response->assertStatus(403);
    }
}
