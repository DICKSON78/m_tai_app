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
            $lock = Cache::lock('run_migrations_lock', 30);
            if ($lock->get()) {
                try {
                    Artisan::call('migrate', ['--force' => true]);
                } catch (\Throwable $e) {
                    // Migration already ran or error
                } finally {
                    $lock->release();
                }
            }
        }
    }
}
