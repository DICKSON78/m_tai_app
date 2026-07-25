@extends('layouts.dashboard')

@section('page-title', 'Dashibodi ya Usafirishaji')

@section('content')
<div class="space-y-6">
    {{-- Welcome --}}
    <div>
        <h2 class="text-2xl font-bold text-gray-800">Karibu, {{ Auth::user()->name }}!</h2>
        <p class="text-gray-500">Hali ya usafirishaji wa leo.</p>
    </div>

    {{-- Stats Grid --}}
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {{-- Pending Deliveries --}}
        <div class="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-500">Zinasubiri Kusafirishwa</p>
                    <p class="text-3xl font-bold text-amber-500 mt-1">{{ number_format($data['pending_deliveries'] ?? 0) }}</p>
                </div>
                <div class="w-14 h-14 bg-amber-50 rounded-xl flex items-center justify-center">
                    <svg class="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                </div>
            </div>
        </div>

        {{-- Active Deliveries --}}
        <div class="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-500">Zinafanywa Sasa</p>
                    <p class="text-3xl font-bold text-primary mt-1">{{ number_format($data['active_deliveries'] ?? 0) }}</p>
                </div>
                <div class="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
                    <svg class="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"/>
                    </svg>
                </div>
            </div>
        </div>

        {{-- Completed Deliveries --}}
        <div class="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-500">Zilizokamilika</p>
                    <p class="text-3xl font-bold text-secondary mt-1">{{ number_format($data['completed_deliveries'] ?? 0) }}</p>
                </div>
                <div class="w-14 h-14 bg-secondary/10 rounded-xl flex items-center justify-center">
                    <svg class="w-7 h-7 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                </div>
            </div>
        </div>
    </div>

    {{-- Pending Deliveries Table --}}
    <div class="bg-white rounded-xl shadow-sm border">
        <div class="p-6 border-b">
            <h3 class="text-lg font-semibold text-gray-800">Maagizo yanayosubiri Usafirishaji</h3>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-gray-50 text-gray-600">
                    <tr>
                        <th class="text-left px-6 py-3 font-medium">Nambari</th>
                        <th class="text-left px-6 py-3 font-medium">Mteja</th>
                        <th class="text-left px-6 py-3 font-medium">Anwani</th>
                        <th class="text-left px-6 py-3 font-medium">Hali</th>
                        <th class="text-left px-6 py-3 font-medium">Kitendo</th>
                    </tr>
                </thead>
                <tbody class="divide-y">
                    @forelse($data['pending_list'] ?? [] as $delivery)
                        <tr class="hover:bg-gray-50">
                            <td class="px-6 py-4 font-medium text-gray-800">#{{ $delivery->id ?? '' }}</td>
                            <td class="px-6 py-4 text-gray-600">{{ $delivery->customer_name ?? '' }}</td>
                            <td class="px-6 py-4 text-gray-600">{{ $delivery->address ?? '' }}</td>
                            <td class="px-6 py-4">
                                @php
                                    $status = $delivery->status ?? 'pending';
                                    $statusColors = [
                                        'pending' => 'bg-amber-100 text-amber-700',
                                        'picked_up' => 'bg-blue-100 text-blue-700',
                                        'in_transit' => 'bg-primary/10 text-primary',
                                        'delivered' => 'bg-secondary/10 text-secondary',
                                    ];
                                    $statusLabels = [
                                        'pending' => 'Inasubiri',
                                        'picked_up' => 'Imechukuliwa',
                                        'in_transit' => 'Inatoka',
                                        'delivered' => 'Imefikishwa',
                                    ];
                                @endphp
                                <span class="px-3 py-1 rounded-full text-xs font-medium {{ $statusColors[$status] ?? 'bg-gray-100 text-gray-700' }}">
                                    {{ $statusLabels[$status] ?? $status }}
                                </span>
                            </td>
                            <td class="px-6 py-4">
                                <a href="{{ url('/transporter/deliveries/' . ($delivery->id ?? '')) }}" class="text-primary hover:text-blue-700 font-medium text-sm">Tazama</a>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="5" class="px-6 py-12 text-center text-gray-400">
                                <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 17h8m0 0V9m0 8l-8-8-4 4-6-6"/>
                                </svg>
                                <p>Hakuna usafirishaji sasa hivi.</p>
                            </td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>
</div>
@endsection
