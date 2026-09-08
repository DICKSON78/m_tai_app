<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\Customer;
use App\Models\Loan;
use App\Models\LoanPayment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LoanTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    protected function setUp(): void
    {
        parent::setUp();

        $this->owner = User::factory()->create(['role' => 'business_owner', 'is_active' => true]);
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

    public function test_owner_can_create_loan(): void
    {
        $business = Business::factory()->create(['user_id' => $this->owner->id]);
        $customer = $this->createCustomerFor($business);

        $this->actingAs($this->owner)
            ->postJson("/api/owner/businesses/{$business->id}/loans", [
                'customer_id' => $customer->id,
                'loan_type' => 'go_pro_bank',
                'loan_amount' => 500000,
                'start_date' => now()->toDateString(),
            ])
            ->assertStatus(201)
            ->assertJsonPath('loan.loan_amount', '500000.00')
            ->assertJsonPath('loan.status', 'active');

        $this->assertDatabaseHas('loans', [
            'business_id' => $business->id,
            'customer_id' => $customer->id,
            'loan_amount' => 500000,
            'status' => 'active',
        ]);
    }

    public function test_owner_can_list_loans(): void
    {
        $business = Business::factory()->create(['user_id' => $this->owner->id]);
        $customer = $this->createCustomerFor($business);

        Loan::create([
            'business_id' => $business->id,
            'customer_id' => $customer->id,
            'loan_type' => 'go_pro_bank',
            'loan_amount' => 500000,
            'loan_balance' => 500000,
            'status' => 'active',
            'start_date' => now()->toDateString(),
        ]);

        $this->actingAs($this->owner)
            ->getJson("/api/owner/businesses/{$business->id}/loans")
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_owner_can_show_loan_with_stats(): void
    {
        $business = Business::factory()->create(['user_id' => $this->owner->id]);
        $customer = $this->createCustomerFor($business);

        $loan = Loan::create([
            'business_id' => $business->id,
            'customer_id' => $customer->id,
            'loan_type' => 'go_pro_bank',
            'loan_amount' => 500000,
            'loan_balance' => 500000,
            'status' => 'active',
            'start_date' => now()->toDateString(),
        ]);

        LoanPayment::create([
            'loan_id' => $loan->id,
            'business_id' => $business->id,
            'amount' => 100000,
            'recorded_by' => $this->owner->id,
        ]);

        $this->actingAs($this->owner)
            ->getJson("/api/owner/businesses/{$business->id}/loans/{$loan->id}")
            ->assertOk()
            ->assertJsonPath('stats.total_paid', 100000)
            ->assertJsonPath('stats.loan_balance', 500000);
    }

    public function test_owner_can_make_loan_payment(): void
    {
        $business = Business::factory()->create(['user_id' => $this->owner->id]);
        $customer = $this->createCustomerFor($business);

        $loan = Loan::create([
            'business_id' => $business->id,
            'customer_id' => $customer->id,
            'loan_type' => 'go_pro_bank',
            'loan_amount' => 500000,
            'loan_balance' => 500000,
            'status' => 'active',
            'start_date' => now()->toDateString(),
        ]);

        $this->actingAs($this->owner)
            ->postJson("/api/owner/businesses/{$business->id}/loans/{$loan->id}/pay", [
                'amount' => 100000,
            ])
            ->assertStatus(201)
            ->assertJsonPath('stats.total_paid', 100000)
            ->assertJsonPath('stats.is_fully_paid', false);

        $this->assertDatabaseHas('loan_payments', [
            'loan_id' => $loan->id,
            'amount' => 100000,
        ]);
    }

    public function test_owner_can_approve_loan(): void
    {
        $business = Business::factory()->create(['user_id' => $this->owner->id]);
        $customer = $this->createCustomerFor($business);

        $loan = Loan::create([
            'business_id' => $business->id,
            'customer_id' => $customer->id,
            'loan_type' => 'go_pro_bank',
            'loan_amount' => 500000,
            'loan_balance' => 500000,
            'status' => 'active',
            'start_date' => now()->toDateString(),
        ]);

        $this->actingAs($this->owner)
            ->postJson("/api/owner/businesses/{$business->id}/loans/{$loan->id}/approve")
            ->assertOk()
            ->assertJsonPath('loan.approved_at', fn ($v) => $v !== null);
    }

    public function test_owner_can_update_loan(): void
    {
        $business = Business::factory()->create(['user_id' => $this->owner->id]);
        $customer = $this->createCustomerFor($business);

        $loan = Loan::create([
            'business_id' => $business->id,
            'customer_id' => $customer->id,
            'loan_type' => 'go_pro_bank',
            'loan_amount' => 500000,
            'loan_balance' => 500000,
            'status' => 'active',
            'start_date' => now()->toDateString(),
        ]);

        $this->actingAs($this->owner)
            ->putJson("/api/owner/businesses/{$business->id}/loans/{$loan->id}", [
                'notes' => 'Notes updated',
            ])
            ->assertOk()
            ->assertJsonPath('loan.notes', 'Notes updated');
    }

    public function test_owner_can_get_loan_summary(): void
    {
        $business = Business::factory()->create(['user_id' => $this->owner->id]);

        $this->actingAs($this->owner)
            ->getJson("/api/owner/businesses/{$business->id}/loans/summary")
            ->assertOk()
            ->assertJsonPath('total_lent', 0)
            ->assertJsonPath('total_repaid', 0);
    }

    public function test_owner_can_use_loan_calculator(): void
    {
        $business = Business::factory()->create(['user_id' => $this->owner->id]);

        $this->actingAs($this->owner)
            ->postJson("/api/owner/businesses/{$business->id}/loans/calculator", [
                'required_capital' => 1000000,
                'timeline_months' => 6,
            ])
            ->assertOk()
            ->assertJsonPath('calculator.required_capital', 1000000)
            ->assertJsonPath('calculator.timeline_months', 6);
    }

    public function test_non_owner_cannot_manage_loans(): void
    {
        $otherOwner = User::factory()->create(['role' => 'business_owner', 'is_active' => true]);
        $business = Business::factory()->create(['user_id' => $otherOwner->id]);
        $customer = $this->createCustomerFor($business);

        $loan = Loan::create([
            'business_id' => $business->id,
            'customer_id' => $customer->id,
            'loan_type' => 'go_pro_bank',
            'loan_amount' => 500000,
            'loan_balance' => 500000,
            'status' => 'active',
            'start_date' => now()->toDateString(),
        ]);

        $this->actingAs($this->owner)
            ->getJson("/api/owner/businesses/{$business->id}/loans/{$loan->id}")
            ->assertStatus(403);
    }
}