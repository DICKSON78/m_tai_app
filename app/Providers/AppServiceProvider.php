<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Cache;
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
            $marker = storage_path('app/migrations_ran');
            if (!file_exists($marker)) {
                try {
                    Artisan::call('migrate', ['--force' => true]);
                    file_put_contents($marker, date('Y-m-d H:i:s'));
                } catch (\Throwable $e) {
                    file_put_contents($marker, 'error: ' . $e->getMessage());
                }
            }
        }
    }
}
