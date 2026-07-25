@extends('layouts.app')

@section('title', 'Jiandikishe - M-TAI')

@section('content')
<div class="min-h-[calc(100vh-10rem)] flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-2xl">
        {{-- Header --}}
        <div class="text-center mb-10">
            <div class="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span class="text-white font-bold text-3xl">M</span>
            </div>
            <h1 class="text-2xl font-bold text-gray-800">Chagua Aina ya Usajili</h1>
            <p class="text-gray-500 mt-2">Chagua jinsi unavyotaka kutumia M-TAI</p>
        </div>

        {{-- Cards --}}
        <div class="grid md:grid-cols-2 gap-6">
            {{-- Business Owner --}}
            <a href="{{ url('/register/seller') }}" class="group block bg-white rounded-2xl shadow-lg p-8 border-2 border-transparent hover:border-primary transition-all duration-300 hover:shadow-xl">
                <div class="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-5 group-hover:bg-primary/20 transition">
                    <svg class="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"/>
                    </svg>
                </div>
                <h2 class="text-xl font-bold text-gray-800 mb-2">Kuwa Mmiliki Biashara</h2>
                <p class="text-gray-500 text-sm mb-6">Simamia biashara yako, bidhaa, wateja, stok, na ripoti zote kwa urahisi.</p>
                <span class="inline-flex items-center text-primary font-semibold text-sm group-hover:translate-x-1 transition-transform">
                    Anza Usajili
                    <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                </span>
            </a>

            {{-- Customer --}}
            <a href="{{ url('/register/customer') }}" class="group block bg-white rounded-2xl shadow-lg p-8 border-2 border-transparent hover:border-secondary transition-all duration-300 hover:shadow-xl">
                <div class="w-14 h-14 bg-secondary/10 rounded-xl flex items-center justify-center mb-5 group-hover:bg-secondary/20 transition">
                    <svg class="w-7 h-7 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                </div>
                <h2 class="text-xl font-bold text-gray-800 mb-2">Kuwa Mteja</h2>
                <p class="text-gray-500 text-sm mb-6">Tafuta bidhaa, weka maagizo, na ufurahie uwasilishaji wa haraka.</p>
                <span class="inline-flex items-center text-secondary font-semibold text-sm group-hover:translate-x-1 transition-transform">
                    Anza Usajili
                    <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                </span>
            </a>
        </div>

        {{-- Login Link --}}
        <p class="text-center mt-8 text-gray-600">
            Tisha akaunti?
            <a href="{{ url('/login') }}" class="text-primary font-semibold hover:text-blue-700">Ingia hapa</a>
        </p>
    </div>
</div>
@endsection
