@extends('layouts.app')

@section('title', 'Jiandikishe kwa Biashara - M-TAI')

@section('content')
<div class="min-h-[calc(100vh-10rem)] flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-2xl">
        {{-- Header --}}
        <div class="text-center mb-8">
            <div class="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"/>
                </svg>
            </div>
            <h1 class="text-2xl font-bold text-gray-800">Jiandikishe kwa Biashara</h1>
            <p class="text-gray-500 mt-1">Unda akaunti ya biashara yako kwenye M-TAI</p>
        </div>

        {{-- Card --}}
        <div class="bg-white rounded-2xl shadow-lg p-8">
            @if($errors->any())
                <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <ul class="space-y-1">
                        @foreach($errors->all() as $error)
                            <li class="text-sm text-red-600 flex items-start space-x-2">
                                <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                                </svg>
                                <span>{{ $error }}</span>
                            </li>
                        @endforeach
                    </ul>
                </div>
            @endif

            <form method="POST" action="{{ url('/register/seller') }}">
                @csrf

                {{-- Section 1: Personal Info --}}
                <div class="mb-8">
                    <div class="flex items-center space-x-3 mb-5">
                        <div class="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                        <h2 class="text-lg font-semibold text-gray-800">Taarifa Binafsi</h2>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <label for="name" class="block text-sm font-medium text-gray-700 mb-1">Jina Kamili</label>
                            <input id="name" type="text" name="name" value="{{ old('name') }}" required
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
                                placeholder="Weka jina lako kamili">
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Barua Pepe</label>
                                <input id="email" type="email" name="email" value="{{ old('email') }}" required
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
                                    placeholder="mfano@gmail.com">
                            </div>

                            <div>
                                <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">Nambari ya Simu</label>
                                <input id="phone" type="text" name="phone" value="{{ old('phone') }}" required
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
                                    placeholder="+255 7XX XXX XXX">
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Nenosiri</label>
                                <input id="password" type="password" name="password" required
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
                                    placeholder="Angalau herufi 8">
                            </div>

                            <div>
                                <label for="password_confirmation" class="block text-sm font-medium text-gray-700 mb-1">Thibitisha Nenosiri</label>
                                <input id="password_confirmation" type="password" name="password_confirmation" required
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
                                    placeholder="Weka nenosiri tena">
                            </div>
                        </div>
                    </div>
                </div>

                <div class="border-t border-gray-200"></div>

                {{-- Section 2: Business Info --}}
                <div class="mt-8">
                    <div class="flex items-center space-x-3 mb-5">
                        <div class="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                        <h2 class="text-lg font-semibold text-gray-800">Taarifa za Biashara</h2>
                    </div>

                    <div class="space-y-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label for="business_name" class="block text-sm font-medium text-gray-700 mb-1">Jina la Biashara</label>
                                <input id="business_name" type="text" name="business_name" value="{{ old('business_name') }}" required
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
                                    placeholder="Jina la biashara yako">
                            </div>

                            <div>
                                <label for="business_type" class="block text-sm font-medium text-gray-700 mb-1">Aina ya Biashara</label>
                                <select id="business_type" name="business_type" required
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition bg-white">
                                    <option value="">-- Chagua --</option>
                                    <option value="shop" {{ old('business_type') === 'shop' ? 'selected' : '' }}>Duka</option>
                                    <option value="wholesale" {{ old('business_type') === 'wholesale' ? 'selected' : '' }}>Usambazaji</option>
                                    <option value="manufacturer" {{ old('business_type') === 'manufacturer' ? 'selected' : '' }}>Mtayarishaji</option>
                                    <option value="service" {{ old('business_type') === 'service' ? 'selected' : '' }}>Huduma</option>
                                    <option value="other" {{ old('business_type') === 'other' ? 'selected' : '' }}>Nyingine</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label for="business_category" class="block text-sm font-medium text-gray-700 mb-1">Kitengo cha Biashara</label>
                            <input id="business_category" type="text" name="business_category" value="{{ old('business_category') }}"
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
                                placeholder="mfano: Chakula, nguo, vifaa">
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label for="region" class="block text-sm font-medium text-gray-700 mb-1">Mkoa</label>
                                <input id="region" type="text" name="region" value="{{ old('region') }}" required
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
                                    placeholder="Mkoa">
                            </div>

                            <div>
                                <label for="district" class="block text-sm font-medium text-gray-700 mb-1">Wilaya</label>
                                <input id="district" type="text" name="district" value="{{ old('district') }}" required
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
                                    placeholder="Wilaya">
                            </div>

                            <div>
                                <label for="ward" class="block text-sm font-medium text-gray-700 mb-1">Kata</label>
                                <input id="ward" type="text" name="ward" value="{{ old('ward') }}" required
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
                                    placeholder="Kata">
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label for="street" class="block text-sm font-medium text-gray-700 mb-1">Barabara</label>
                                <input id="street" type="text" name="street" value="{{ old('street') }}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
                                    placeholder="Barabara">
                            </div>

                            <div>
                                <label for="road" class="block text-sm font-medium text-gray-700 mb-1">Njia</label>
                                <input id="road" type="text" name="road" value="{{ old('road') }}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
                                    placeholder="Njia">
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label for="payment_code" class="block text-sm font-medium text-gray-700 mb-1">Nambari ya Malipo (M-Pesa/Tigo Pesa)</label>
                                <input id="payment_code" type="text" name="payment_code" value="{{ old('payment_code') }}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
                                    placeholder="+255 7XX XXX XXX">
                            </div>

                            <div>
                                <label for="bank_account_number" class="block text-sm font-medium text-gray-700 mb-1">Nambari ya Akaunti ya Benki</label>
                                <input id="bank_account_number" type="text" name="bank_account_number" value="{{ old('bank_account_number') }}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
                                    placeholder="Nambari ya akaunti">
                            </div>
                        </div>
                    </div>
                </div>

                {{-- Submit --}}
                <div class="mt-8">
                    <button type="submit" class="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition shadow-md hover:shadow-lg">
                        Jiandikishe Biashara
                    </button>
                </div>
            </form>
        </div>

        {{-- Login Link --}}
        <p class="text-center mt-6 text-gray-600">
            Tisha akaunti?
            <a href="{{ url('/login') }}" class="text-primary font-semibold hover:text-blue-700">Ingia hapa</a>
        </p>
    </div>
</div>
@endsection
