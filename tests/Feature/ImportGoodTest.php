<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\ImportGood;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ImportGoodTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    protected function setUp(): void
    {
        parent::setUp();

        $this->owner = User::factory()->create(['role' => 'business_owner', 'is_active' => true]);
    }

    public function test_owner_can_create_import_good(): void
    {
        $business = Business::factory()->create(['user_id' => $this->owner->id]);

        $this->actingAs($this->owner)
            ->postJson("/api/owner/businesses/{$business->id}/imports", [
                'item_name' => 'Maggi cubes',
                'quantity' => 200,
                'buying_price' => 500,
                'selling_price' => 1000,
                'payment_method' => 'cash',
            ])
            ->assertStatus(201)
            ->assertJsonPath('import_good.item_name', 'Maggi cubes')
            ->assertJsonPath('import_good.status', 'pending');

        $this->assertDatabaseHas('import_goods', [
            'business_id' => $business->id,
            'item_name' => 'Maggi cubes',
            'quantity' => 200,
        ]);
    }

    public function test_owner_can_list_import_goods(): void
    {
        $business = Business::factory()->create(['user_id' => $this->owner->id]);

        $business->importGoods()->create([
            'item_name' => 'Maggi cubes',
            'quantity' => 200,
            'buying_price' => 500,
            'selling_price' => 1000,
            'payment_method' => 'cash',
            'status' => 'pending',
        ]);

        $this->actingAs($this->owner)
            ->getJson("/api/owner/businesses/{$business->id}/imports")
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_owner_can_update_import_good(): void
    {
        $business = Business::factory()->create(['user_id' => $this->owner->id]);

        $import = $business->importGoods()->create([
            'item_name' => 'Maggi cubes',
            'quantity' => 200,
            'buying_price' => 500,
            'selling_price' => 1000,
            'payment_method' => 'cash',
            'status' => 'pending',
        ]);

        $this->actingAs($this->owner)
            ->putJson("/api/owner/businesses/{$business->id}/imports/{$import->id}", [
                'quantity' => 250,
            ])
            ->assertOk();

        $this->assertDatabaseHas('import_goods', ['id' => $import->id, 'quantity' => 250]);
    }

    public function test_owner_can_update_import_status(): void
    {
        $business = Business::factory()->create(['user_id' => $this->owner->id]);

        $import = $business->importGoods()->create([
            'item_name' => 'Maggi cubes',
            'quantity' => 200,
            'buying_price' => 500,
            'selling_price' => 1000,
            'payment_method' => 'cash',
            'status' => 'pending',
        ]);

        $this->actingAs($this->owner)
            ->putJson("/api/owner/businesses/{$business->id}/imports/{$import->id}/status", [
                'status' => 'received',
            ])
            ->assertOk()
            ->assertJsonPath('import_good.status', 'received');
    }

    public function test_owner_can_delete_import_good(): void
    {
        $business = Business::factory()->create(['user_id' => $this->owner->id]);

        $import = $business->importGoods()->create([
            'item_name' => 'Maggi cubes',
            'quantity' => 200,
            'buying_price' => 500,
            'selling_price' => 1000,
            'payment_method' => 'cash',
            'status' => 'pending',
        ]);

        $this->actingAs($this->owner)
            ->deleteJson("/api/owner/businesses/{$business->id}/imports/{$import->id}")
            ->assertOk();

        $this->assertDatabaseMissing('import_goods', ['id' => $import->id]);
    }

    public function test_non_owner_cannot_manage_imports(): void
    {
        $otherOwner = User::factory()->create(['role' => 'business_owner', 'is_active' => true]);
        $business = Business::factory()->create(['user_id' => $otherOwner->id]);

        $this->actingAs($this->owner)
            ->getJson("/api/owner/businesses/{$business->id}/imports")
            ->assertStatus(403);
    }
}