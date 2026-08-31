<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user()->load([
            'businesses:id,business_name,business_code',
            'customer:id,full_name,phone',
            'transporter:id,full_name,phone,vehicle_type,plate_number',
        ]);

        return response()->json($user);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone' => 'sometimes|string|max:20',
            'email' => 'sometimes|email|unique:users,email,' . $request->user()->id,
        ]);

        $request->user()->update($validated);

        return response()->json([
            'message' => 'Profaili imesasishwa.',
            'user' => $request->user()->fresh(),
        ]);
    }

    public function changePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        if (!Hash::check($validated['current_password'], $request->user()->password)) {
            return response()->json(['message' => 'Nenosiri la zamani si sahihi.'], 422);
        }

        $request->user()->update([
            'password' => Hash::make($validated['new_password']),
        ]);

        return response()->json(['message' => 'Nenosiri limebadilishwa.']);
    }

    public function uploadAvatar(Request $request)
    {
        $request->validate([
            'avatar' => 'required|image|max:2048',
        ]);

        $path = $request->file('avatar')->store('avatars', 'public');
        $request->user()->update(['avatar' => $path]);

        return response()->json([
            'message' => 'Picha ya profaili imewekwa.',
            'avatar' => Storage::url($path),
        ]);
    }

    public function destroy(Request $request)
    {
        $request->user()->delete();

        return response()->json([
            'message' => 'Akaunti imefutwa.',
        ]);
    }
}
