<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Business;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use App\Mail\PasswordResetMail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
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
            'ward' => $validated['ward'] ?? '-',
            'street' => $validated['street'] ?? '-',
            'road' => $validated['road'] ?? '-',
            'payment_code' => $validated['payment_code'] ?? '-',
            'bank_account_number' => $validated['bank_account_number'] ?? '-',
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

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $user->email],
            ['token' => Hash::make($token), 'created_at' => now()]
        );

        try {
            Mail::to($user->email)->send(new PasswordResetMail($user->email, $token));
        } catch (\Exception $e) {
            \Log::error('Failed to send password reset email: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Reset token has been generated. Check your email.',
            'token' => $token,
        ]);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
            'token' => 'required|string',
            'password' => ['required', 'confirmed', Password::min(6)],
        ], [
            'email.exists' => 'Barua pepe hii haijpatikani.',
            'token.required' => 'Tokeni inahitajika.',
            'password.confirmed' => 'Nenosiri hazifanani.',
        ]);

        $resetRecord = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        if (!$resetRecord || !Hash::check($request->token, $resetRecord->token)) {
            return response()->json(['message' => 'Tokeni hii si sahihi au imeisha muda.'], 422);
        }

        $tokenAge = now()->diffInMinutes($resetRecord->created_at);
        if ($tokenAge > 60) {
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();
            return response()->json(['message' => 'Tokeni hii imeisha muda. Tafadhali omba tokeni mpya.'], 422);
        }

        $user = User::where('email', $request->email)->first();
        $user->update(['password' => Hash::make($request->password)]);

        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        return response()->json(['message' => 'Nenosari limefanikiwa kubadilishwa. Sasa unaweza kuingia.']);
    }
}
