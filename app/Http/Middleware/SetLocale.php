<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Session;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        $locale = Session::get('locale', config('app.locale', 'en'));
        
        // Validate locale
        if (!in_array($locale, ['en', 'sw'])) {
            $locale = config('app.locale', 'en');
        }
        
        App::setLocale($locale);
        $request->setLocale($locale);
        
        return $next($request);
    }
}
