<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmployeeTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;
    private Business $business;

    protected function setUp(): void
    {
        parent::setUp();

        $this->owner = User::factory()->create(['role' => 'business_owner', 'is_active' => true]);
        $this->business = Business::factory()->create(['user_id' => $this->owner->id]);
    }

    public function test_owner_can_create_employee_and_user_is_loginable(): void
    {
        $this->actingAs($this->owner)
            ->postJson("/api/owner/businesses/{$this->business->id}/employees", [
                'name' => 'E2E Cashier',
                'phone' => '0712345999',
                'position' => 'cashier',
                'salary' => 300000,
            ])
            ->assertStatus(201)
            ->assertJsonPath('employee.name', 'E2E Cashier')
            ->assertJsonPath('employee.position', 'cashier');

        $this->assertDatabaseHas('employees', [
            'business_id' => $this->business->id,
            'name' => 'E2E Cashier',
            'phone' => '0712345999',
        ]);

        $user = User::where('phone', '0712345999')->first();
        $this->assertNotNull($user);
        $this->assertEquals('employee', $user->role);
        $this->assertNotNull($user->email);
        $this->assertNotNull($user->password);
        $this->assertTrue(password_verify('password', $user->password));
    }

    public function test_non_owner_cannot_create_employee(): void
    {
        $otherOwner = User::factory()->create(['role' => 'business_owner', 'is_active' => true]);

        $this->actingAs($otherOwner)
            ->postJson("/api/owner/businesses/{$this->business->id}/employees", [
                'name' => 'Intruder',
                'phone' => '0712345000',
                'position' => 'cashier',
                'salary' => 100000,
            ])
            ->assertStatus(403);
    }

    public function test_owner_can_list_employees(): void
    {
        Employee::create([
            'business_id' => $this->business->id,
            'user_id' => $this->owner->id,
            'name' => 'Asha',
            'phone' => '0712345001',
            'position' => 'cashier',
            'salary' => 100000,
            'is_active' => true,
        ]);

        $this->actingAs($this->owner)
            ->getJson("/api/owner/businesses/{$this->business->id}/employees")
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }
}
