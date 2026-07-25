<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Business;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Admin user
        User::firstOrCreate(
            ['email' => 'admin@m-tai.com'],
            [
                'name' => 'Msimamizi',
                'phone' => '0700000000',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'user_code' => 'ADMIN-000001',
                'is_active' => true,
                'is_verified' => true,
            ]
        );

        // Test Business Owner
        $owner = User::firstOrCreate(
            ['email' => 'juma@m-tai.com'],
            [
                'name' => 'Juma Mwangani',
                'phone' => '0712345678',
                'password' => Hash::make('password'),
                'role' => 'business_owner',
                'user_code' => 'CTVK-000001',
                'is_active' => true,
                'is_verified' => true,
            ]
        );

        Business::firstOrCreate(
            ['user_id' => $owner->id],
            [
                'business_name' => 'Juma Supermarket',
                'business_code' => 'Ilala-00001',
                'business_type' => 'Supermarket',
                'business_category' => 'Groceries',
                'region' => 'Dar es Salaam',
                'district' => 'Ilala',
                'ward' => 'Kariakoo',
                'payment_code' => 'JUMA-001',
                'status' => 'active',
                'is_published' => true,
            ]
        );

        // Test Customer
        User::firstOrCreate(
            ['email' => 'amina@m-tai.com'],
            [
                'name' => 'Amina Juma',
                'phone' => '0787654321',
                'password' => Hash::make('password'),
                'role' => 'customer',
                'user_code' => 'CTVK-000002',
                'is_active' => true,
                'is_verified' => true,
            ]
        );
    }
}
