<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\District;
use App\Models\Region;
use App\Models\Street;
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

    public function streets(Request $request)
    {
        $request->validate([
            'ward_id' => 'required|exists:wards,id',
        ]);

        return Street::where('ward_id', $request->ward_id)
            ->orWhereNull('ward_id')
            ->orderBy('name')
            ->get(['id', 'ward_id', 'name']);
    }

    public function learnStreet(Request $request)
    {
        $request->validate([
            'ward_id' => 'required|exists:wards,id',
            'name' => 'required|string|max:255',
        ]);

        $street = Street::firstOrCreate(
            ['ward_id' => $request->ward_id, 'name' => trim($request->name)],
            ['is_seeded' => false]
        );

        return $street->only(['id', 'ward_id', 'name']);
    }
}