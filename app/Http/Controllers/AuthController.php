<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    // Show login form
    public function showLogin()
    {
        return view('auth.login');
    }

    // Handle login
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'login' => 'required|string',
            'password' => 'required',
        ]);

        // Allow login with email, phone, or user_code
        $field = filter_var($credentials['login'], FILTER_VALIDATE_EMAIL) ? 'email'
            : (preg_match('/^\d{10}$/', $credentials['login']) ? 'phone' : 'user_code');

        $user = User::where($field, $credentials['login'])->first();

        if ($user && Hash::check($credentials['password'], $user->password)) {
            if (!$user->is_active) {
                return back()->withErrors(['login' => 'Akaunti yako imesimamishwa.']);
            }
            Auth::login($user);
            $request->session()->regenerate();
            return $this->redirectBasedOnRole($user);
        }

        return back()->withErrors(['login' => 'Kiwango au nenosiri si sahihi.'])->onlyInput('login');
    }

    // Show registration form (determines customer vs seller by route name)
    public function showRegister()
    {
        $route = request()->route()->getName();
        if ($route === 'register.customer') {
            return view('auth.register-customer');
        }
        return view('auth.register-seller');
    }

    // Handle customer registration
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

        Auth::login($user);
        return redirect()->route('customer.dashboard');
    }

    // Handle seller registration
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

        // Create the first business
        $businessCode = \App\Models\Business::generateBusinessCode($validated['district']);

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

        Auth::login($user);
        return redirect()->route('owner.dashboard');
    }

    // Show register type selection
    public function showRegisterType()
    {
        return view('auth.register-type');
    }

    // Logout
    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect('/');
    }

    // Redirect based on role
    protected function redirectBasedOnRole(User $user)
    {
        return match($user->role) {
            'admin' => redirect()->route('admin.dashboard'),
            'business_owner' => redirect()->route('owner.dashboard'),
            'employee' => redirect()->route('employee.dashboard'),
            'customer' => redirect()->route('customer.dashboard'),
            'transporter' => redirect()->route('transporter.dashboard'),
            default => redirect()->route('customer.dashboard'),
        };
    }
}
