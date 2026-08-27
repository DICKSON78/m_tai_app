<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinute(5)->by($request->input('login') . '|' . $request->ip());
        });

        RateLimiter::for('register', function (Request $request) {
            return Limit::perMinute(3)->by($request->ip());
        });

        if (env('RUN_MIGRATIONS') === 'true') {
            $tables = ['orders', 'customers', 'expenses'];
            foreach ($tables as $table) {
                try {
                    $columns = DB::select("SHOW COLUMNS FROM `$table` LIKE 'deleted_at'");
                    if (empty($columns)) {
                        DB::statement("ALTER TABLE `$table` ADD COLUMN `deleted_at` timestamp NULL DEFAULT NULL");
                        DB::statement("ALTER TABLE `$table` ADD INDEX `{$table}_deleted_at_index` (`deleted_at`)");
                    }
                } catch (\Throwable $e) {
                    // Table might not exist yet, skip
                }
            }
        }
    }
}
