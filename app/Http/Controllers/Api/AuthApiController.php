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
use Firebase\JWT\JWT;
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

    /**
     * Verify a Google ID token (from Google Identity Services) and
     * log in / create the matching user.
     */
    public function googleLogin(Request $request)
    {
        $request->validate([
            'id_token' => 'required|string',
        ]);

        $token = $this->verifyGoogleIdToken($request->id_token);

        if (!$token) {
            throw ValidationException::withMessages([
                'id_token' => ['Uthibitisho wa Google haukufanikiwa.'],
            ]);
        }

        $googleId = $token['sub'];
        $email = $token['email'] ?? null;
        $name = $token['name'] ?? null;
        $avatar = $token['picture'] ?? null;

        if (!$email) {
            throw ValidationException::withMessages([
                'id_token' => ['Barua pepe ya Google haikupatikana.'],
            ]);
        }

        $user = User::where('google_id', $googleId)->first();

        if (!$user) {
            $user = User::where('email', $email)->first();
            if ($user && !$user->google_id) {
                // Link an existing account that was created with a password.
                $user->update([
                    'google_id' => $googleId,
                    'avatar' => $avatar ?: $user->avatar,
                ]);
            }
        }

        if (!$user) {
            $user = User::create([
                'name' => $name ?? explode('@', $email)[0],
                'email' => $email,
                'phone' => null,
                'password' => null,
                'photo' => $avatar,
                'avatar' => $avatar,
                'google_id' => $googleId,
                'role' => 'customer',
                'user_code' => User::generateUserCode(),
            ]);
        }

        if (!$user->is_active) {
            throw ValidationException::withMessages([
                'id_token' => ['Akaunti yako imesimamishwa.'],
            ]);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    /**
     * Validate a Firebase Auth ID token (issued after Google sign-in) and
     * return its claims, or null.
     */
    protected function verifyGoogleIdToken(string $idToken): ?array
    {
        try {
            $projectId = config('services.firebase.project_id');
            $apiKey = config('services.firebase.api_key');

            if (!$projectId || !$apiKey) {
                \Log::error('Firebase project_id/api_key are not configured.');
                return null;
            }

            $jwt = explode('.', $idToken);
            if (count($jwt) !== 3) {
                return null;
            }

            $header = (array) JWT::jsonDecode(JWT::urlsafeB64Decode($jwt[0]));
            $kid = $header['kid'] ?? null;
            if (!$kid) {
                return null;
            }

            $pem = $this->fetchFirebasePublicKey($kid);
            if (!$pem) {
                \Log::warning('Could not resolve Firebase public key for kid=' . $kid);
                return null;
            }

            $decoded = JWT::decode($idToken, new \Firebase\JWT\Key($pem, 'RS256'));

            $payload = (array) $decoded;

            $expectedAud = $projectId;
            $expectedIss = 'https://securetoken.google.com/' . $projectId;

            if (($payload['aud'] ?? null) !== $expectedAud) {
                \Log::warning('Firebase ID token audience mismatch.');
                return null;
            }

            if (($payload['iss'] ?? null) !== $expectedIss) {
                \Log::warning('Firebase ID token issuer mismatch.');
                return null;
            }

            if (($payload['exp'] ?? 0) < time()) {
                \Log::warning('Firebase ID token has expired.');
                return null;
            }

            return $payload;
        } catch (\Throwable $e) {
            \Log::error('Firebase ID token verification failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Fetch a single Firebase public signing key (PEM) for the given kid.
     * Firebase keys rotate ~hourly, so we fetch without long-lived caching.
     */
    protected function fetchFirebasePublicKey(string $kid): ?string
    {
        try {
            $apiKey = config('services.firebase.api_key');
            $url = 'https://www.googleapis.com/identitytoolkit/v3/relyingparty/publicKeys?key=' . urlencode($apiKey);

            $response = \Illuminate\Support\Facades\Http::timeout(10)->get($url);

            if (!$response->successful()) {
                return null;
            }

            $keys = $response->json();

            return $keys[$kid] ?? null;
        } catch (\Throwable $e) {
            \Log::error('Failed to fetch Firebase keys: ' . $e->getMessage());
            return null;
        }
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
            'photo' => 'nullable|string|max:255',
            'nida_number' => 'nullable|string|max:50',
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
            'photo' => $validated['photo'] ?? null,
            'nida_number' => $validated['nida_number'] ?? null,
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
            'business_logo' => 'nullable|string|max:255',
            'working_days' => 'nullable|array',
            'working_days.*' => 'string',
            'working_hours' => 'nullable|array',
            'working_hours.*' => 'string',
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
            'business_logo' => $validated['business_logo'] ?? null,
            'working_days' => $validated['working_days'] ?? null,
            'working_hours' => $validated['working_hours'] ?? null,
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

    public function registerLogistic(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone' => 'required|string|unique:users,phone',
            'password' => ['required', 'confirmed', Password::min(6)],
            'vehicle_type' => 'required|string|max:255',
            'plate_number' => 'nullable|string|max:50',
            'region' => 'nullable|string|max:255',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'password' => Hash::make($validated['password']),
            'region' => $validated['region'] ?? null,
            'role' => 'transporter',
            'user_code' => User::generateUserCode(),
        ]);

        $user->transporter()->create([
            'full_name' => $validated['name'],
            'phone' => $validated['phone'],
            'vehicle_type' => $validated['vehicle_type'],
            'plate_number' => $validated['plate_number'] ?? null,
            'is_active' => true,
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
