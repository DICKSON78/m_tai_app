<?php

namespace Tests\Feature;

use App\Models\Transporter;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TransporterRegisterTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_transporter_creates_loginable_user_and_transporter(): void
    {
        $this->postJson('/api/register/transporter', [
            'name' => 'E2E Transporter',
            'email' => 'transporter@m-tai.com',
            'phone' => '0712345888',
            'password' => 'password',
            'password_confirmation' => 'password',
            'vehicle_type' => 'boda',
            'plate_number' => 'T123ABC',
            'region' => 'Dar es Salaam',
        ])
            ->assertStatus(201)
            ->assertJsonPath('user.email', 'transporter@m-tai.com')
            ->assertJsonPath('user.role', 'transporter')
            ->assertJsonStructure(['token']);

        $user = User::where('email', 'transporter@m-tai.com')->first();
        $this->assertNotNull($user);
        $this->assertEquals('transporter', $user->role);

        $this->assertDatabaseHas('transporters', [
            'user_id' => $user->id,
            'full_name' => 'E2E Transporter',
            'phone' => '0712345888',
            'vehicle_type' => 'boda',
            'plate_number' => 'T123ABC',
            'is_active' => true,
        ]);

        $this->assertTrue(password_verify('password', $user->password));
    }
}
