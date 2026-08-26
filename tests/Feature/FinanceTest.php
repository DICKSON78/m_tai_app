<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Business;
use App\Models\Invoice;
use App\Models\JournalEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FinanceTest extends TestCase
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

    public function test_list_chart_of_accounts(): void
    {
        Account::create([
            'business_id' => $this->business->id,
            'code' => '1000',
            'name' => 'Cash',
            'type' => 'asset',
            'is_active' => true,
        ]);
        Account::create([
            'business_id' => $this->business->id,
            'code' => '2000',
            'name' => 'Accounts Payable',
            'type' => 'liability',
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->owner)
            ->getJson('/api/owner/finance/accounts');

        $response->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.code', '1000')
            ->assertJsonPath('data.1.code', '2000');
    }

    public function test_create_journal_entry(): void
    {
        $debitAccount = Account::create([
            'business_id' => $this->business->id,
            'code' => '1000',
            'name' => 'Cash',
            'type' => 'asset',
            'is_active' => true,
        ]);
        $creditAccount = Account::create([
            'business_id' => $this->business->id,
            'code' => '4000',
            'name' => 'Sales Revenue',
            'type' => 'revenue',
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->owner)
            ->postJson('/api/owner/finance/journal', [
                'date' => '2026-01-15',
                'description' => 'Cash sale',
                'reference' => 'JE-001',
                'lines' => [
                    ['account_id' => $debitAccount->id, 'debit' => 5000, 'credit' => 0],
                    ['account_id' => $creditAccount->id, 'debit' => 0, 'credit' => 5000],
                ],
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('description', 'Cash sale')
            ->assertJsonPath('total_debit', '5000.00');

        $this->assertDatabaseHas('journal_entries', [
            'business_id' => $this->business->id,
            'description' => 'Cash sale',
        ]);
    }

    public function test_create_journal_entry_rejects_unbalanced(): void
    {
        $account = Account::create([
            'business_id' => $this->business->id,
            'code' => '1000',
            'name' => 'Cash',
            'type' => 'asset',
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->owner)
            ->postJson('/api/owner/finance/journal', [
                'date' => '2026-01-15',
                'description' => 'Unbalanced entry',
                'lines' => [
                    ['account_id' => $account->id, 'debit' => 5000, 'credit' => 0],
                    ['account_id' => $account->id, 'debit' => 0, 'credit' => 3000],
                ],
            ]);

        $response->assertStatus(422);
    }

    public function test_create_invoice(): void
    {
        $response = $this->actingAs($this->owner)
            ->postJson('/api/owner/finance/invoices', [
                'invoice_number' => 'INV-001',
                'date' => '2026-01-15',
                'due_date' => '2026-02-15',
                'notes' => 'Test invoice',
                'items' => [
                    ['description' => 'Product A', 'quantity' => 2, 'unit_price' => 1000, 'tax_rate' => 0],
                    ['description' => 'Product B', 'quantity' => 1, 'unit_price' => 2500, 'tax_rate' => 0],
                ],
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('invoice_number', 'INV-001')
            ->assertJsonPath('status', 'draft');

        $this->assertDatabaseHas('invoices', [
            'business_id' => $this->business->id,
            'invoice_number' => 'INV-001',
            'status' => 'draft',
        ]);
    }

    public function test_finance_report_profit_loss(): void
    {
        $response = $this->actingAs($this->owner)
            ->getJson('/api/owner/finance/reports/profit-loss');

        $response->assertOk()
            ->assertJsonStructure([
                'period' => ['from', 'to'],
                'revenues',
                'expenses',
                'total_revenue',
                'total_expenses',
                'net_income',
            ]);
    }

    public function test_unauthenticated_user_cannot_access_finance(): void
    {
        $response = $this->getJson('/api/owner/finance/accounts');

        $response->assertStatus(401);
    }

    public function test_non_owner_cannot_access_finance(): void
    {
        $customer = User::factory()->create(['role' => 'customer', 'is_active' => true]);

        $response = $this->actingAs($customer)
            ->getJson('/api/owner/finance/accounts');

        $response->assertStatus(403);
    }
}
