<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReviewTest extends TestCase
{
    use RefreshDatabase;

    private User $customer;
    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->customer = User::factory()->create(['role' => 'customer', 'is_active' => true]);
        $business = Business::factory()->create(['status' => 'active']);
        $this->product = Product::factory()->create([
            'business_id' => $business->id,
            'is_published' => true,
            'quantity' => 10,
            'selling_price' => 5000,
        ]);
    }

    public function test_list_product_reviews(): void
    {
        Review::create([
            'product_id' => $this->product->id,
            'user_id' => $this->customer->id,
            'rating' => 5,
            'comment' => 'Nzuri sana!',
            'is_approved' => true,
        ]);

        $this->actingAs($this->customer)
            ->getJson("/api/products/{$this->product->id}/reviews")
            ->assertOk()
            ->assertJsonPath('total_reviews', 1)
            ->assertJsonPath('average_rating', 5);
    }

    public function test_customer_can_create_review(): void
    {
        $this->actingAs($this->customer)
            ->postJson("/api/products/{$this->product->id}/reviews", [
                'rating' => 4,
                'comment' => 'Mazuri.',
            ])
            ->assertStatus(201)
            ->assertJsonPath('review.rating', 4);

        $this->assertDatabaseHas('reviews', [
            'product_id' => $this->product->id,
            'user_id' => $this->customer->id,
            'rating' => 4,
        ]);
    }

    public function test_customer_cannot_review_twice(): void
    {
        Review::create([
            'product_id' => $this->product->id,
            'user_id' => $this->customer->id,
            'rating' => 5,
            'is_approved' => true,
        ]);

        $this->actingAs($this->customer)
            ->postJson("/api/products/{$this->product->id}/reviews", ['rating' => 3])
            ->assertStatus(422);
    }

    public function test_validates_rating_range(): void
    {
        $this->actingAs($this->customer)
            ->postJson("/api/products/{$this->product->id}/reviews", ['rating' => 6])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['rating']);
    }

    public function test_owner_can_update_own_review(): void
    {
        $review = Review::create([
            'product_id' => $this->product->id,
            'user_id' => $this->customer->id,
            'rating' => 3,
            'is_approved' => true,
        ]);

        $this->actingAs($this->customer)
            ->putJson("/api/reviews/{$review->id}", ['rating' => 5, 'comment' => 'Updated'])
            ->assertOk()
            ->assertJsonPath('review.rating', 5);
    }

    public function test_cannot_update_other_users_review(): void
    {
        $other = User::factory()->create(['role' => 'customer', 'is_active' => true]);
        $review = Review::create([
            'product_id' => $this->product->id,
            'user_id' => $other->id,
            'rating' => 5,
            'is_approved' => true,
        ]);

        $this->actingAs($this->customer)
            ->putJson("/api/reviews/{$review->id}", ['rating' => 1])
            ->assertStatus(403);
    }

    public function test_owner_can_delete_own_review(): void
    {
        $review = Review::create([
            'product_id' => $this->product->id,
            'user_id' => $this->customer->id,
            'rating' => 4,
            'is_approved' => true,
        ]);

        $this->actingAs($this->customer)
            ->deleteJson("/api/reviews/{$review->id}")
            ->assertOk();

        $this->assertDatabaseMissing('reviews', ['id' => $review->id]);
    }
}
