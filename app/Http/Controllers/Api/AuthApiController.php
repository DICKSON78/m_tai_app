<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Business;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthApiController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'login' => 'required|string',
            'password' => 'required',
        ]);

        $field = filter_var($request->login, FILTER_VALIDATE_EMAIL) ? 'email'
            : (preg_match('/^\d{10}$/', $request->login) ? 'phone' : 'user_code');

        $user = User::where($field, $request->login)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'login' => ['Kiwango au nenosiri si sahihi.'],
            ]);
        }

        if (!$user->is_active) {
            throw ValidationException::withMessages([
                'login' => ['Akaunti yako imesimamishwa.'],
            ]);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function registerCustomer(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone' => 'required|string|unique:users,phone',
            'password' => ['required', 'confirmed', Password::min(6)],
            'location' => 'nullable|string|max:255',
            'street' => 'nullable|string|max:255',
            'road' => 'nullable|string|max:255',
            'age' => 'nullable|integer|min:13|max:120',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'password' => Hash::make($validated['password']),
            'location' => $validated['location'] ?? null,
            'street' => $validated['street'] ?? null,
            'road' => $validated['road'] ?? null,
            'age' => $validated['age'] ?? null,
            'role' => 'customer',
            'user_code' => User::generateUserCode(),
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    public function registerSeller(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone' => 'required|string|unique:users,phone',
            'password' => ['required', 'confirmed', Password::min(6)],
            'business_name' => 'required|string|max:255',
            'business_type' => 'required|string|max:255',
            'business_category' => 'required|string|max:255',
            'region' => 'required|string|max:255',
            'district' => 'required|string|max:255',
            'ward' => 'nullable|string|max:255',
            'street' => 'nullable|string|max:255',
            'road' => 'nullable|string|max:255',
            'payment_code' => 'nullable|string|max:50',
            'bank_account_number' => 'nullable|string|max:50',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'password' => Hash::make($validated['password']),
            'role' => 'business_owner',
            'user_code' => User::generateUserCode(),
        ]);

        $businessCode = Business::generateBusinessCode($validated['district']);

        $user->businesses()->create([
            'business_name' => $validated['business_name'],
            'business_code' => $businessCode,
            'business_type' => $validated['business_type'],
            'business_category' => $validated['business_category'],
            'region' => $validated['region'],
            'district' => $validated['district'],
            'ward' => $validated['ward'] ?? null,
            'street' => $validated['street'] ?? null,
            'road' => $validated['road'] ?? null,
            'payment_code' => $validated['payment_code'] ?? null,
            'bank_account_number' => $validated['bank_account_number'] ?? null,
            'status' => 'pending',
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Umefanikiwa kutoka.']);
    }

    public function user(Request $request)
    {
        return response()->json($request->user());
    }

    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        $user = User::where('email', $request->email)->first();
        $token = strtoupper(bin2hex(random_bytes(16)));

        cache()->put('password_reset_' . $user->id, $token, now()->addMinutes(30));

        return response()->json([
            'message' => 'Reset token has been generated. Check your email.',
            'token' => $token,
        ]);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
            'password' => ['required', 'confirmed', Password::min(6)],
        ]);

        $userId = null;
        foreach (cache()->getMetas() ?? [] as $meta) {
            // Search all cache entries for matching token
        }

        // Find user by token in cache
        $foundUser = null;
        $allUsers = User::all();
        foreach ($allUsers as $u) {
            if (cache()->get('password_reset_' . $u->id) === $request->token) {
                $foundUser = $u;
                break;
            }
        }

        if (!$foundUser) {
            return response()->json(['message' => 'Invalid or expired reset token.'], 422);
        }

        $foundUser->update(['password' => Hash::make($request->password)]);
        cache()->forget('password_reset_' . $foundUser->id);

        return response()->json(['message' => 'Password has been reset successfully. You can now login.']);
    }
}
