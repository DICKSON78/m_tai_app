<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    protected function setUp(): void
    {
        parent::setUp();

        $this->owner = User::factory()->create(['role' => 'business_owner', 'is_active' => true]);
    }

    public function test_owner_can_create_category(): void
    {
        $business = Business::factory()->create(['user_id' => $this->owner->id]);

        $this->actingAs($this->owner)
            ->postJson("/api/owner/businesses/{$business->id}/categories", [
                'name' => 'Vinywaji',
            ])
            ->assertStatus(201)
            ->assertJsonPath('name', 'Vinywaji')
            ->assertJsonPath('business_id', $business->id);

        $this->assertDatabaseHas('categories', [
            'business_id' => $business->id,
            'name' => 'Vinywaji',
        ]);
    }

    public function test_owner_can_list_root_categories(): void
    {
        $business = Business::factory()->create(['user_id' => $this->owner->id]);

        Category::create(['business_id' => $business->id, 'name' => 'A', 'slug' => 'a-1']);
        Category::create(['business_id' => $business->id, 'name' => 'B', 'slug' => 'b-1']);

        $this->actingAs($this->owner)
            ->getJson("/api/owner/businesses/{$business->id}/categories")
            ->assertOk()
            ->assertJsonCount(2);
    }

    public function test_owner_can_create_subcategory(): void
    {
        $business = Business::factory()->create(['user_id' => $this->owner->id]);

        $parent = Category::create(['business_id' => $business->id, 'name' => 'Vinywaji', 'slug' => 'vinywaji-1']);

        $this->actingAs($this->owner)
            ->postJson("/api/owner/businesses/{$business->id}/categories", [
                'name' => 'Juice',
                'parent_id' => $parent->id,
            ])
            ->assertStatus(201)
            ->assertJsonPath('parent_id', $parent->id);
    }

    public function test_owner_can_update_category(): void
    {
        $business = Business::factory()->create(['user_id' => $this->owner->id]);

        $category = Category::create(['business_id' => $business->id, 'name' => 'Vinywaji', 'slug' => 'vinywaji-1']);

        $this->actingAs($this->owner)
            ->putJson("/api/owner/categories/{$category->id}", [
                'name' => 'Vyakula',
            ])
            ->assertOk()
            ->assertJsonPath('name', 'Vyakula');
    }

    public function test_category_cannot_be_its_own_parent(): void
    {
        $business = Business::factory()->create(['user_id' => $this->owner->id]);

        $category = Category::create(['business_id' => $business->id, 'name' => 'Vinywaji', 'slug' => 'vinywaji-1']);

        $this->actingAs($this->owner)
            ->putJson("/api/owner/categories/{$category->id}", [
                'parent_id' => $category->id,
            ])
            ->assertStatus(422);
    }

    public function test_owner_can_delete_empty_category(): void
    {
        $business = Business::factory()->create(['user_id' => $this->owner->id]);

        $category = Category::create(['business_id' => $business->id, 'name' => 'Vinywaji', 'slug' => 'vinywaji-1']);

        $this->actingAs($this->owner)
            ->deleteJson("/api/owner/categories/{$category->id}")
            ->assertOk();

        $this->assertDatabaseMissing('categories', ['id' => $category->id]);
    }

    public function test_cannot_delete_category_with_children(): void
    {
        $business = Business::factory()->create(['user_id' => $this->owner->id]);

        $parent = Category::create(['business_id' => $business->id, 'name' => 'Vinywaji', 'slug' => 'vinywaji-1']);
        Category::create(['business_id' => $business->id, 'name' => 'Juice', 'slug' => 'juice-1', 'parent_id' => $parent->id]);

        $this->actingAs($this->owner)
            ->deleteJson("/api/owner/categories/{$parent->id}")
            ->assertStatus(422);
    }

    public function test_non_owner_cannot_manage_category(): void
    {
        $otherOwner = User::factory()->create(['role' => 'business_owner', 'is_active' => true]);
        $business = Business::factory()->create(['user_id' => $otherOwner->id]);

        $category = Category::create(['business_id' => $business->id, 'name' => 'Vinywaji', 'slug' => 'vinywaji-1']);

        $this->actingAs($this->owner)
            ->deleteJson("/api/owner/categories/{$category->id}")
            ->assertStatus(403);
    }

    public function test_owner_can_get_category_tree(): void
    {
        $business = Business::factory()->create(['user_id' => $this->owner->id]);

        $parent = Category::create(['business_id' => $business->id, 'name' => 'Vinywaji', 'slug' => 'vinywaji-1']);
        Category::create(['business_id' => $business->id, 'name' => 'Juice', 'slug' => 'juice-1', 'parent_id' => $parent->id]);

        $this->actingAs($this->owner)
            ->getJson("/api/owner/businesses/{$business->id}/categories/tree")
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.children.0.name', 'Juice');
    }
}