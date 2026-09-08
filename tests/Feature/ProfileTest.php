<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create([
            'role' => 'customer',
            'is_active' => true,
            'password' => Hash::make('secret123'),
        ]);
    }

    public function test_show_profile_returns_user(): void
    {
        $this->actingAs($this->user)
            ->getJson('/api/profile')
            ->assertOk()
            ->assertJsonPath('email', $this->user->email);
    }

    public function test_update_profile_name_and_phone(): void
    {
        $this->actingAs($this->user)
            ->putJson('/api/profile', [
                'name' => 'Updated Name',
                'phone' => '0711111111',
            ])
            ->assertOk()
            ->assertJsonPath('user.name', 'Updated Name')
            ->assertJsonPath('user.phone', '0711111111');
    }

    public function test_change_password_with_correct_current(): void
    {
        $this->actingAs($this->user)
            ->putJson('/api/profile/password', [
                'current_password' => 'secret123',
                'new_password' => 'newsecret123',
                'new_password_confirmation' => 'newsecret123',
            ])
            ->assertOk();

        $this->assertTrue(Hash::check('newsecret123', $this->user->fresh()->password));
    }

    public function test_change_password_rejects_wrong_current(): void
    {
        $this->actingAs($this->user)
            ->putJson('/api/profile/password', [
                'current_password' => 'wrongpassword',
                'new_password' => 'newsecret123',
                'new_password_confirmation' => 'newsecret123',
            ])
            ->assertStatus(422);
    }

    public function test_upload_avatar_stores_file(): void
    {
        $file = UploadedFile::fake()->image('avatar.png', 100, 100);

        $this->actingAs($this->user)
            ->post('/api/profile/avatar', ['avatar' => $file])
            ->assertOk()
            ->assertJsonStructure(['message', 'avatar']);

        $this->assertNotNull($this->user->fresh()->avatar);
    }

    public function test_destroy_deletes_account(): void
    {
        $this->actingAs($this->user)
            ->deleteJson('/api/profile')
            ->assertOk();

        $this->assertDatabaseMissing('users', ['id' => $this->user->id]);
    }

    public function test_unauthenticated_user_cannot_access_profile(): void
    {
        $this->getJson('/api/profile')->assertStatus(401);
    }
}
