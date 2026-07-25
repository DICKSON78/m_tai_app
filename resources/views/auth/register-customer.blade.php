@extends('layouts.app')

@section('title', 'Jiandikishe kama Mteja - M-TAI')

@section('content')
<div class="min-h-[calc(100vh-10rem)] flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-lg">
        {{-- Header --}}
        <div class="text-center mb-8">
            <div class="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
            </div>
            <h1 class="text-2xl font-bold text-gray-800">Jiandikishe kama Mteja</h1>
            <p class="text-gray-500 mt-1">Jaza taarifa zako kuunda akaunti</p>
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

            <form method="POST" action="{{ url('/register/customer') }}">
                @csrf

                <div class="space-y-5">
                    {{-- Name --}}
                    <div>
                        <label for="name" class="block text-sm font-medium text-gray-700 mb-1">Jina Kamili</label>
                        <input id="name" type="text" name="name" value="{{ old('name') }}" required
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary outline-none transition"
                            placeholder="Weka jina lako kamili">
                    </div>

                    {{-- Email --}}
                    <div>
                        <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Barua Pepe</label>
                        <input id="email" type="email" name="email" value="{{ old('email') }}" required
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary outline-none transition"
                            placeholder="mfano@gmail.com">
                    </div>

                    {{-- Phone --}}
                    <div>
                        <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">Nambari ya Simu</label>
                        <input id="phone" type="text" name="phone" value="{{ old('phone') }}" required
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary outline-none transition"
                            placeholder="+255 7XX XXX XXX">
                    </div>

                    {{-- Password --}}
                    <div>
                        <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Nenosiri</label>
                        <input id="password" type="password" name="password" required
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary outline-none transition"
                            placeholder="Weka nenosiri (angalau herufi 8)">
                    </div>

                    {{-- Password Confirmation --}}
                    <div>
                        <label for="password_confirmation" class="block text-sm font-medium text-gray-700 mb-1">Thibitisha Nenosiri</label>
                        <input id="password_confirmation" type="password" name="password_confirmation" required
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary outline-none transition"
                            placeholder="Weka nenosiri tena">
                    </div>

                    <div class="border-t pt-5">
                        <h3 class="text-sm font-semibold text-gray-700 mb-3">Mahali</h3>

                        {{-- Location --}}
                        <div class="mb-4">
                            <label for="location" class="block text-sm font-medium text-gray-700 mb-1">Eneo</label>
                            <input id="location" type="text" name="location" value="{{ old('location') }}"
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary outline-none transition"
                                placeholder="Mji / Wilaya">
                        </div>

                        <div class="grid grid-cols-2 gap-4 mb-4">
                            {{-- Street --}}
                            <div>
                                <label for="street" class="block text-sm font-medium text-gray-700 mb-1">Barabara</label>
                                <input id="street" type="text" name="street" value="{{ old('street') }}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary outline-none transition"
                                    placeholder="Barabara">
                            </div>

                            {{-- Road --}}
                            <div>
                                <label for="road" class="block text-sm font-medium text-gray-700 mb-1">Njia</label>
                                <input id="road" type="text" name="road" value="{{ old('road') }}"
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary outline-none transition"
                                    placeholder="Njia">
                            </div>
                        </div>

                        {{-- Age --}}
                        <div>
                            <label for="age" class="block text-sm font-medium text-gray-700 mb-1">Umri</label>
                            <input id="age" type="number" name="age" value="{{ old('age') }}" min="10" max="120"
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary outline-none transition"
                                placeholder="Umri wako">
                        </div>
                    </div>

                    {{-- Submit --}}
                    <button type="submit" class="w-full bg-secondary text-white py-3 rounded-lg font-semibold hover:bg-emerald-600 transition shadow-md hover:shadow-lg">
                        Jiandikishe
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
