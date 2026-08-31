<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Transport rate per kilometre (TZS)
    |--------------------------------------------------------------------------
    | Used by the Import Goods module to auto-calculate transport cost
    | when the owner does not supply it manually (SRS §17).
    */
    'transport_rate_per_km' => env('MTAI_TRANSPORT_RATE_PER_KM', 1000),

    /*
    |--------------------------------------------------------------------------
    | Savings & Investment allocation (SRS §19)
    |--------------------------------------------------------------------------
    | Perfect Profit allocation percentages. All configurable except
    | life insurance which is fixed by the SRS.
    */
    'savings_allocation' => [
        'investment' => env('MTAI_ALLOCATION_INVESTMENT', 50),
        'life_insurance' => env('MTAI_ALLOCATION_LIFE_INSURANCE', 20),
        'savings' => env('MTAI_ALLOCATION_SAVINGS', 15),
        'wallet' => env('MTAI_ALLOCATION_WALLET', 5),
        'bata' => env('MTAI_ALLOCATION_BATA', 10),
    ],

    /*
    |--------------------------------------------------------------------------
    | Project allocation (SRS §20)
    |--------------------------------------------------------------------------
    */
    'project_allocation' => [
        'investment' => 65,
        'life_insurance' => 20,
        'savings' => 5,
        'wallet' => 7,
        'bata' => 3,
    ],

    /*
    |--------------------------------------------------------------------------
    | Subscription pricing (SRS §22)
    |--------------------------------------------------------------------------
    | M-TAI service charges are based on business performance. Daily rates are
    | selected from the bracket matching the business's computed profit and then
    | scaled to the chosen plan duration via the multipliers below. Admins may
    | override rates at runtime.
    */
    'subscription_rates' => [
        'below_100000' => env('MTAI_SUBSCRIPTION_BELOW_100K', 1000),
        'below_500000' => env('MTAI_SUBSCRIPTION_BELOW_500K', 2000),
        'below_1000000' => env('MTAI_SUBSCRIPTION_BELOW_1M', 3000),
        'above_1000000' => env('MTAI_SUBSCRIPTION_ABOVE_1M', 5000),
    ],

    /*
    |--------------------------------------------------------------------------
    | Subscription plan duration multipliers (SRS §22)
    |--------------------------------------------------------------------------
    | Seconds in a period -> converts a daily rate to the plan total.
    */
    'subscription_plan_multipliers' => [
        'daily' => 1,
        'monthly' => 30,
        'quarterly' => 90,
        'yearly' => 365,
    ],

    /*
    |--------------------------------------------------------------------------
    | Employee permission matrix (SRS §2.3)
    |--------------------------------------------------------------------------
    | Default permissions granted to each employee position. The store per
    | employee `employees.permissions` JSON column overrides these defaults.
    | Permissions are enforced by EmployeePermissionMiddleware on employee routes.
    */
    'employee_permissions' => [
        'cashier' => ['view_inventory', 'view_customers', 'view_orders', 'process_orders', 'manage_expenses'],
        'storekeeper' => ['view_inventory', 'manage_inventory', 'view_customers', 'view_orders'],
        'manager' => [
            'view_inventory', 'manage_inventory', 'view_customers', 'view_orders',
            'process_orders', 'manage_expenses', 'manage_attendance', 'view_reports',
            'manage_deliveries', 'view_deliveries',
        ],
        'delivery_officer' => ['view_inventory', 'view_customers', 'view_orders', 'view_deliveries', 'manage_deliveries'],
    ],
];
