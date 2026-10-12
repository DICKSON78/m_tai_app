<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Session;

class LanguageController extends Controller
{
    public function switch(Request $request)
    {
        $request->validate([
            'locale' => 'required|string|in:en,sw',
        ]);

        $locale = $request->input('locale');
        Session::put('locale', $locale);
        App::setLocale($locale);

        return response()->json([
            'success' => true,
            'locale' => $locale,
        ]);
    }

    public function current()
    {
        return response()->json([
            'locale' => App::getLocale(),
        ]);
    }
}
