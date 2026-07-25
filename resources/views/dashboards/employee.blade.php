@extends('layouts.dashboard')

@section('page-title', 'Dashibodi ya Mfanyakazi')

@section('content')
<div class="space-y-6">
    {{-- Welcome --}}
    <div>
        <h2 class="text-2xl font-bold text-gray-800">Karibu, {{ Auth::user()->name }}!</h2>
        <p class="text-gray-500">Maporomoko ya kazi yako ya leo.</p>
    </div>

    {{-- Stats Grid --}}
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {{-- Today's Orders --}}
        <div class="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-500">Maagizo ya Leo</p>
                    <p class="text-3xl font-bold text-primary mt-1">{{ number_format($data['today_orders'] ?? 0) }}</p>
                </div>
                <div class="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
                    <svg class="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                    </svg>
                </div>
            </div>
        </div>

        {{-- Today's Sales --}}
        <div class="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-500">Mauzo ya Leo</p>
                    <p class="text-3xl font-bold text-secondary mt-1">TZS {{ number_format($data['today_sales'] ?? 0) }}</p>
                </div>
                <div class="w-14 h-14 bg-secondary/10 rounded-xl flex items-center justify-center">
                    <svg class="w-7 h-7 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                    </svg>
                </div>
            </div>
        </div>
    </div>

    {{-- Quick Actions --}}
    <div class="bg-white rounded-xl shadow-sm border p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Hatua za Haraka</h3>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <a href="{{ url('/employee/customers') }}" class="flex flex-col items-center p-4 rounded-xl bg-primary/5 hover:bg-primary/10 transition text-center">
                <svg class="w-8 h-8 text-primary mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                <span class="text-sm font-medium text-gray-700">Wateja</span>
            </a>
            <a href="{{ url('/employee/inventory') }}" class="flex flex-col items-center p-4 rounded-xl bg-secondary/5 hover:bg-secondary/10 transition text-center">
                <svg class="w-8 h-8 text-secondary mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
                <span class="text-sm font-medium text-gray-700">Stok</span>
            </a>
            <a href="{{ url('/employee/deliveries') }}" class="flex flex-col items-center p-4 rounded-xl bg-purple-50 hover:bg-purple-100 transition text-center">
                <svg class="w-8 h-8 text-purple-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 17h8m0 0V9m0 8l-8-8-4 4-6-6"/>
                </svg>
                <span class="text-sm font-medium text-gray-700">Uwasilishaji</span>
            </a>
        </div>
    </div>
</div>
@endsection
