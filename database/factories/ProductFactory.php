<?php

namespace Database\Factories;

use App\Models\Business;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        return [
            'business_id' => Business::factory(),
            'category_id' => null,
            'name' => $this->faker->word(),
            'slug' => Str::slug($this->faker->unique()->word()),
            'buying_price' => $this->faker->numberBetween(100, 5000),
            'selling_price' => $this->faker->numberBetween(200, 10000),
            'quantity' => $this->faker->numberBetween(0, 100),
            'unit' => 'pcs',
            'low_stock_threshold' => 5,
            'reorder_quantity' => 10,
            'is_track_stock' => true,
            'is_published' => true,
            'is_draft' => false,
        ];
    }
}
