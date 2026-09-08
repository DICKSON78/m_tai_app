<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\Expense;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExpenseTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    protected function setUp(): void
    {
        parent::setUp();

        $this->owner = User::factory()->create(['role' => 'business_owner', 'is_active' => true]);
    }

    public function test_owner_can_create_expense(): void
    {
        $business = Business::factory()->create(['user_id' => $this->owner->id]);

        $this->actingAs($this->owner)
            ->postJson("/api/owner/businesses/{$business->id}/expenses", [
                'category' => 'rent',
                'description' => 'Kodi ya jengo',
                'amount' => 150000,
                'type' => 'monthly',
                'date' => now()->toDateString(),
            ])
            ->assertStatus(201)
            ->assertJsonPath('expense.amount', '150000.00')
            ->assertJsonPath('expense.category', 'rent');

        $this->assertDatabaseHas('expenses', [
            'business_id' => $business->id,
            'category' => 'rent',
            'amount' => 150000,
        ]);
    }

    public function test_owner_can_list_expenses(): void
    {
        $business = Business::factory()->create(['user_id' => $this->owner->id]);

        Expense::create([
            'business_id' => $business->id,
            'category' => 'transport',
            'amount' => 20000,
            'type' => 'daily',
            'date' => now()->toDateString(),
            'recorded_by' => $this->owner->id,
        ]);

        $this->actingAs($this->owner)
            ->getJson("/api/owner/businesses/{$business->id}/expenses")
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_owner_can_filter_expenses_by_category(): void
    {
        $business = Business::factory()->create(['user_id' => $this->owner->id]);

        Expense::create([
            'business_id' => $business->id,
            'category' => 'transport',
            'amount' => 20000,
            'type' => 'daily',
            'date' => now()->toDateString(),
            'recorded_by' => $this->owner->id,
        ]);
        Expense::create([
            'business_id' => $business->id,
            'category' => 'rent',
            'amount' => 150000,
            'type' => 'monthly',
            'date' => now()->toDateString(),
            'recorded_by' => $this->owner->id,
        ]);

        $this->actingAs($this->owner)
            ->getJson("/api/owner/businesses/{$business->id}/expenses?category=transport")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.category', 'transport');
    }

    public function test_owner_can_update_expense(): void
    {
        $business = Business::factory()->create(['user_id' => $this->owner->id]);

        $expense = Expense::create([
            'business_id' => $business->id,
            'category' => 'transport',
            'amount' => 20000,
            'type' => 'daily',
            'date' => now()->toDateString(),
            'recorded_by' => $this->owner->id,
        ]);

        $this->actingAs($this->owner)
            ->putJson("/api/owner/expenses/{$expense->id}", [
                'amount' => 25000,
            ])
            ->assertOk()
            ->assertJsonPath('expense.amount', '25000.00');
    }

    public function test_owner_can_delete_expense(): void
    {
        $business = Business::factory()->create(['user_id' => $this->owner->id]);

        $expense = Expense::create([
            'business_id' => $business->id,
            'category' => 'transport',
            'amount' => 20000,
            'type' => 'daily',
            'date' => now()->toDateString(),
            'recorded_by' => $this->owner->id,
        ]);

        $this->actingAs($this->owner)
            ->deleteJson("/api/owner/expenses/{$expense->id}")
            ->assertOk();

        $this->assertDatabaseMissing('expenses', ['id' => $expense->id]);
    }

    public function test_non_owner_cannot_manage_expense(): void
    {
        $otherOwner = User::factory()->create(['role' => 'business_owner', 'is_active' => true]);
        $business = Business::factory()->create(['user_id' => $otherOwner->id]);

        $expense = Expense::create([
            'business_id' => $business->id,
            'category' => 'transport',
            'amount' => 20000,
            'type' => 'daily',
            'date' => now()->toDateString(),
            'recorded_by' => $otherOwner->id,
        ]);

        $this->actingAs($this->owner)
            ->deleteJson("/api/owner/expenses/{$expense->id}")
            ->assertStatus(403);
    }
}