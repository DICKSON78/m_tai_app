@extends('layouts.app')

@section('content')
<div class="flex h-[calc(100vh-4rem)]">
    {{-- Sidebar Overlay (mobile) --}}
    <div id="sidebar-overlay" class="fixed inset-0 bg-black bg-opacity-50 z-40 hidden md:hidden" onclick="toggleSidebar()"></div>

    {{-- Sidebar --}}
    <aside id="sidebar" class="fixed md:static inset-y-0 left-0 z-50 w-64 bg-white border-r transform -translate-x-full md:translate-x-0 transition-transform duration-200 ease-in-out flex flex-col">
        <div class="flex items-center justify-between p-4 border-b md:hidden">
            <span class="font-bold text-lg text-gray-800">Menu</span>
            <button onclick="toggleSidebar()" class="text-gray-500 hover:text-gray-700">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
        </div>

        <nav class="flex-1 overflow-y-auto p-4 space-y-1">
            @php
                $role = Auth::user()->role ?? 'customer';
                $current = request()->segment(2) ?? 'dashboard';
            @endphp

            @if($role === 'admin')
                <x-sidebar-link href="{{ url('/admin/dashboard') }}" icon="home" label="Dashibodi" active="{{ $current === 'dashboard' }}" />
                <x-sidebar-link href="{{ url('/admin/shops') }}" icon="store" label="Maduka" active="{{ $current === 'shops' }}" />
                <x-sidebar-link href="{{ url('/admin/customers') }}" icon="users" label="Wateja" active="{{ $current === 'customers' }}" />
                <x-sidebar-link href="{{ url('/admin/subscriptions') }}" icon="credit-card" label="Usajili" active="{{ $current === 'subscriptions' }}" />
                <x-sidebar-link href="{{ url('/admin/reports') }}" icon="chart" label="Ripoti" active="{{ $current === 'reports' }}" />
                <x-sidebar-link href="{{ url('/admin/announcements') }}" icon="megaphone" label="Tangazo" active="{{ $current === 'announcements' }}" />

            @elseif($role === 'business_owner')
                <x-sidebar-link href="{{ url('/owner/dashboard') }}" icon="home" label="Dashibodi" active="{{ $current === 'dashboard' }}" />
                <x-sidebar-link href="{{ url('/owner/shops') }}" icon="store" label="Biashara" active="{{ $current === 'shops' }}" />
                <x-sidebar-link href="{{ url('/owner/products') }}" icon="package" label="Bidhaa" active="{{ $current === 'products' }}" />
                <x-sidebar-link href="{{ url('/owner/customers') }}" icon="users" label="Wateja" active="{{ $current === 'customers' }}" />
                <x-sidebar-link href="{{ url('/owner/employees') }}" icon="user-group" label="Wafanyakazi" active="{{ $current === 'employees' }}" />
                <x-sidebar-link href="{{ url('/owner/inventory') }}" icon="clipboard" label="Stok" active="{{ $current === 'inventory' }}" />
                <x-sidebar-link href="{{ url('/owner/loans') }}" icon="banknotes" label="Mikopo" active="{{ $current === 'loans' }}" />
                <x-sidebar-link href="{{ url('/owner/expenses') }}" icon="currency-dollar" label="Gharama" active="{{ $current === 'expenses' }}" />
                <x-sidebar-link href="{{ url('/owner/income') }}" icon="trending-up" label="Mapato" active="{{ $current === 'income' }}" />
                <x-sidebar-link href="{{ url('/owner/deliveries') }}" icon="truck" label="Uwasilishaji" active="{{ $current === 'deliveries' }}" />
                <x-sidebar-link href="{{ url('/owner/reports') }}" icon="chart-bar" label="Ripoti" active="{{ $current === 'reports' }}" />

            @elseif($role === 'employee')
                <x-sidebar-link href="{{ url('/employee/dashboard') }}" icon="home" label="Dashibodi" active="{{ $current === 'dashboard' }}" />
                <x-sidebar-link href="{{ url('/employee/customers') }}" icon="users" label="Wateja" active="{{ $current === 'customers' }}" />
                <x-sidebar-link href="{{ url('/employee/inventory') }}" icon="clipboard" label="Stok" active="{{ $current === 'inventory' }}" />
                <x-sidebar-link href="{{ url('/employee/expenses') }}" icon="currency-dollar" label="Gharama" active="{{ $current === 'expenses' }}" />
                <x-sidebar-link href="{{ url('/employee/deliveries') }}" icon="truck" label="Uwasilishaji" active="{{ $current === 'deliveries' }}" />

            @elseif($role === 'transporter')
                <x-sidebar-link href="{{ url('/transporter/dashboard') }}" icon="home" label="Dashibodi" active="{{ $current === 'dashboard' }}" />
                <x-sidebar-link href="{{ url('/transporter/deliveries') }}" icon="truck" label="Uwasilishaji" active="{{ $current === 'deliveries' }}" />

            @else
                <x-sidebar-link href="{{ url('/customer/dashboard') }}" icon="home" label="Dashibodi" active="{{ $current === 'dashboard' }}" />
                <x-sidebar-link href="{{ url('/customer/shops') }}" icon="store" label="Duka" active="{{ $current === 'shops' }}" />
                <x-sidebar-link href="{{ url('/customer/orders') }}" icon="shopping-cart" label="Maagizo" active="{{ $current === 'orders' }}" />
                <x-sidebar-link href="{{ url('/customer/profile') }}" icon="user" label="Profaili" active="{{ $current === 'profile' }}" />
            @endif
        </nav>

        <div class="p-4 border-t">
            <a href="{{ url('/dashboard') }}" class="flex items-center space-x-2 text-gray-500 hover:text-primary transition text-sm">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                <span>Mipangilio</span>
            </a>
        </div>
    </aside>

    {{-- Main Content --}}
    <div class="flex-1 flex flex-col overflow-hidden">
        {{-- Top bar --}}
        <div class="bg-white border-b px-4 py-3 flex items-center justify-between">
            <button onclick="toggleSidebar()" class="md:hidden text-gray-600 hover:text-primary">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                </svg>
            </button>
            <h1 class="text-lg font-semibold text-gray-800">@yield('page-title', 'Dashibodi')</h1>
            <div class="w-6"></div>
        </div>

        {{-- Page Content --}}
        <div class="flex-1 overflow-y-auto p-4 md:p-6">
            @if(session('success'))
                <div class="mb-4 p-4 bg-secondary/10 border border-secondary/30 text-secondary rounded-lg flex items-center space-x-2">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                    <span>{{ session('success') }}</span>
                </div>
            @endif

            @if(session('error'))
                <div class="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center space-x-2">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
                    <span>{{ session('error') }}</span>
                </div>
            @endif

            @yield('content')
        </div>
    </div>
</div>

<script>
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    sidebar.classList.toggle('-translate-x-full');
    overlay.classList.toggle('hidden');
}
</script>
@endsection
