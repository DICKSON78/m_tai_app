<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\HrEmployee;
use App\Models\Attendance;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HrTest extends TestCase
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

    private function createEmployee(array $overrides = []): HrEmployee
    {
        return HrEmployee::create(array_merge([
            'business_id' => $this->business->id,
            'employee_number' => 'EMP-' . strtoupper(uniqid()),
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'email' => fake()->unique()->safeEmail(),
            'position' => 'Staff',
            'hire_date' => now()->toDateString(),
            'base_salary' => 300000,
            'status' => 'active',
        ], $overrides));
    }

    public function test_list_employees(): void
    {
        $this->createEmployee(['employee_number' => 'EMP-001', 'first_name' => 'John']);
        $this->createEmployee(['employee_number' => 'EMP-002', 'first_name' => 'Jane']);

        $response = $this->actingAs($this->owner)
            ->getJson('/api/owner/hr/employees');

        $response->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_create_employee(): void
    {
        $response = $this->actingAs($this->owner)
            ->postJson('/api/owner/hr/employees', [
                'employee_number' => 'EMP-001',
                'first_name' => 'John',
                'last_name' => 'Doe',
                'email' => 'john@example.com',
                'position' => 'Manager',
                'hire_date' => '2026-01-15',
                'base_salary' => 500000,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('employee_number', 'EMP-001')
            ->assertJsonPath('first_name', 'John');

        $this->assertDatabaseHas('hr_employees', [
            'business_id' => $this->business->id,
            'employee_number' => 'EMP-001',
        ]);
    }

    public function test_list_attendance(): void
    {
        $employee = $this->createEmployee(['employee_number' => 'EMP-001']);
        Attendance::create([
            'employee_id' => $employee->id,
            'date' => '2026-01-15',
            'status' => 'present',
        ]);

        $response = $this->actingAs($this->owner)
            ->getJson('/api/owner/hr/attendance');

        $response->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_create_attendance_record(): void
    {
        $employee = $this->createEmployee(['employee_number' => 'EMP-001']);

        $response = $this->actingAs($this->owner)
            ->postJson('/api/owner/hr/attendance', [
                'employee_id' => $employee->id,
                'date' => '2026-01-15',
                'status' => 'present',
                'clock_in' => '08:00:00',
                'clock_out' => '17:00:00',
                'hours_worked' => 8,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('status', 'present');

        $this->assertDatabaseHas('attendance', [
            'employee_id' => $employee->id,
            'date' => now()->parse('2026-01-15')->toDateTimeString(),
        ]);
    }

    public function test_unauthenticated_user_cannot_access_hr(): void
    {
        $response = $this->getJson('/api/owner/hr/employees');

        $response->assertStatus(401);
    }

    public function test_non_owner_cannot_access_hr(): void
    {
        $customer = User::factory()->create(['role' => 'customer', 'is_active' => true]);

        $response = $this->actingAs($customer)
            ->getJson('/api/owner/hr/employees');

        $response->assertStatus(403);
    }
}
