<?php

namespace Database\Factories;

use App\Models\Business;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class BusinessFactory extends Factory
{
    protected $model = Business::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'business_name' => $this->faker->company(),
            'business_code' => 'ILA-'.$this->faker->unique()->numerify('######'),
            'business_type' => 'retail',
            'business_category' => 'supermarket',
            'region' => 'Dar es Salaam',
            'district' => 'Ilala',
            'ward' => 'Kariakoo',
            'payment_code' => 'PAY-'.$this->faker->unique()->numerify('######'),
            'status' => 'active',
            'is_published' => true,
        ];
    }
}
