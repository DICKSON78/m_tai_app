<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\District;
use App\Models\Region;
use App\Models\Ward;
use Illuminate\Http\Request;

class LocationController extends Controller
{
    public function regions()
    {
        return Region::orderBy('name')->get(['id', 'name', 'is_archipelago']);
    }

    public function districts(Request $request)
    {
        $request->validate([
            'region_id' => 'required|exists:regions,id',
        ]);

        return District::where('region_id', $request->region_id)
            ->orderBy('name')
            ->get(['id', 'region_id', 'name']);
    }

    public function wards(Request $request)
    {
        $request->validate([
            'district_id' => 'required|exists:districts,id',
        ]);

        return Ward::where('district_id', $request->district_id)
            ->orderBy('name')
            ->get(['id', 'district_id', 'name']);
    }
}