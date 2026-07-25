<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function getSettings(Request $request, Business $business)
    {
        if ($business->user_id !== $request->user()->id) {
            abort(403);
        }

        $defaults = [
            'currency' => 'TZS',
            'tax_rate' => 0,
            'receipt_header' => $business->business_name,
            'receipt_footer' => 'Asante kwa kununua!',
            'low_stock_threshold' => 5,
            'auto_accept_orders' => false,
            'enable_delivery' => true,
            'enable_loans' => true,
            'business_hours_open' => '08:00',
            'business_hours_close' => '18:00',
        ];

        $settings = array_merge($defaults, $business->settings ?? []);

        return response()->json($settings);
    }

    public function updateSettings(Request $request, Business $business)
    {
        if ($business->user_id !== $request->user()->id) {
            abort(403);
        }

        $validated = $request->validate([
            'currency' => 'sometimes|string',
            'tax_rate' => 'sometimes|numeric|min:0|max:100',
            'receipt_header' => 'sometimes|string|max:255',
            'receipt_footer' => 'sometimes|string|max:255',
            'low_stock_threshold' => 'sometimes|integer|min:0',
            'auto_accept_orders' => 'sometimes|boolean',
            'enable_delivery' => 'sometimes|boolean',
            'enable_loans' => 'sometimes|boolean',
            'business_hours_open' => 'sometimes|string',
            'business_hours_close' => 'sometimes|string',
        ]);

        $current = $business->settings ?? [];
        $business->update(['settings' => array_merge($current, $validated)]);

        return response()->json([
            'message' => 'Mipangilio imesasishwa.',
            'settings' => $business->fresh()->settings,
        ]);
    }

    public function getSystemSettings(Request $request)
    {
        $user = $request->user();

        if (!in_array($user->role, ['admin', 'superadmin'])) {
            abort(403);
        }

        $settings = cache()->remember('system_settings', 3600, function () {
            return [
                'app_name' => 'M-TAI',
                'app_version' => '1.0.0',
                'currency' => 'TZS',
                'max_file_upload_size' => 2048,
                'max_businesses_per_user' => 5,
                'default_pagination' => 20,
                'maintenance_mode' => false,
            ];
        });

        return response()->json($settings);
    }
}
