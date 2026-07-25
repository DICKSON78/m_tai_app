<?php

use Illuminate\Support\Facades\Route;

// SPA - serve the React app for all routes
Route::get('/{any?}', function () {
    return view('app');
})->where('any', '.*');
