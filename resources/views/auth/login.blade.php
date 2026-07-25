@extends('layouts.app')

@section('title', 'Ingia - M-TAI')

@section('content')
<div class="min-h-[calc(100vh-10rem)] flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md">
        {{-- Logo --}}
        <div class="text-center mb-8">
            <div class="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span class="text-white font-bold text-3xl">M</span>
            </div>
            <h1 class="text-2xl font-bold text-gray-800">Ingia kwenye M-TAI</h1>
            <p class="text-gray-500 mt-1">Ingia ili kuendelea</p>
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

            <form method="POST" action="{{ route('login') }}">
                @csrf

                <div class="space-y-5">
                    {{-- Login Field --}}
                    <div>
                        <label for="login" class="block text-sm font-medium text-gray-700 mb-1">Barua pepe / Nambari ya Simu / Jina la mtumiaji</label>
                        <input id="login" type="text" name="login" value="{{ old('login') }}" required autofocus
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
                            placeholder="Weka barua pepe, simu, au jina la mtumiaji">
                    </div>

                    {{-- Password --}}
                    <div>
                        <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Nenosiri</label>
                        <input id="password" type="password" name="password" required
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
                            placeholder="Weka nenosiri lako">
                    </div>

                    {{-- Remember & Forgot --}}
                    <div class="flex items-center justify-between">
                        <label class="flex items-center space-x-2">
                            <input type="checkbox" name="remember" class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary">
                            <span class="text-sm text-gray-600">Nikumbuke</span>
                        </label>
                        @if(Route::has('password.request'))
                            <a href="{{ route('password.request') }}" class="text-sm text-primary hover:text-blue-700">Sahau nenosiri?</a>
                        @endif
                    </div>

                    {{-- Submit --}}
                    <button type="submit" class="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition shadow-md hover:shadow-lg">
                        Ingia
                    </button>
                </div>
            </form>
        </div>

        {{-- Register Link --}}
        <p class="text-center mt-6 text-gray-600">
            Hauna akaunti?
            <a href="{{ url('/register') }}" class="text-primary font-semibold hover:text-blue-700">Jiandikishe hapa</a>
        </p>
    </div>
</div>
@endsection
