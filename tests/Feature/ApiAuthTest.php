<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApiAuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_returns_token(): void
    {
        $user = User::factory()->create([
            'role' => 'customer',
            'password' => bcrypt('secret123'),
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/login', [
            'login' => $user->email,
            'password' => 'secret123',
        ]);

        $response->assertOk()
            ->assertJsonStructure(['user', 'token'])
            ->assertJsonPath('user.email', $user->email);
    }

    public function test_login_rejects_wrong_password(): void
    {
        $user = User::factory()->create([
            'role' => 'customer',
            'password' => bcrypt('secret123'),
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/login', [
            'login' => $user->email,
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(422);
    }

    public function test_register_customer_returns_user_and_token(): void
    {
        $response = $this->postJson('/api/register/customer', [
            'name' => 'Test Customer',
            'email' => 'customer@example.com',
            'phone' => '0712345678',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['user' => ['id', 'name', 'email', 'role'], 'token'])
            ->assertJsonPath('user.role', 'customer')
            ->assertJsonPath('user.email', 'customer@example.com');

        $this->assertDatabaseHas('users', [
            'email' => 'customer@example.com',
            'role' => 'customer',
        ]);
    }

    public function test_register_customer_validates_required_fields(): void
    {
        $response = $this->postJson('/api/register/customer', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email', 'phone', 'password']);
    }
}
