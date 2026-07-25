@extends('layouts.dashboard')

@section('page-title', 'Dashibodi yako')

@section('content')
<div class="space-y-6">
    {{-- Welcome --}}
    <div class="bg-gradient-to-r from-primary to-blue-400 rounded-2xl p-6 text-white">
        <h2 class="text-2xl font-bold">Karibu, {{ Auth::user()->name }}! 👋</h2>
        <p class="mt-1 text-blue-100">Tumia M-TAI kununua bidhaa kwa urahisi na haraka.</p>
        <a href="{{ url('/customer/shops') }}" class="inline-flex items-center mt-4 bg-white text-primary px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-50 transition">
            Tazama Maduka
            <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
        </a>
    </div>

    {{-- Recent Orders --}}
    <div class="bg-white rounded-xl shadow-sm border">
        <div class="p-6 border-b">
            <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-800">Maagizo ya Hivi Karibuni</h3>
                <a href="{{ url('/customer/orders') }}" class="text-sm text-primary hover:text-blue-700 font-medium">Ona yote</a>
            </div>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-gray-50 text-gray-600">
                    <tr>
                        <th class="text-left px-6 py-3 font-medium">Nambari ya Agizo</th>
                        <th class="text-left px-6 py-3 font-medium">Duka</th>
                        <th class="text-left px-6 py-3 font-medium">Kiasi</th>
                        <th class="text-left px-6 py-3 font-medium">Hali</th>
                        <th class="text-left px-6 py-3 font-medium">Tarehe</th>
                    </tr>
                </thead>
                <tbody class="divide-y">
                    @forelse($data['recent_orders'] ?? [] as $order)
                        <tr class="hover:bg-gray-50">
                            <td class="px-6 py-4 font-medium text-gray-800">#{{ $order->id ?? '' }}</td>
                            <td class="px-6 py-4 text-gray-600">{{ $order->shop_name ?? '' }}</td>
                            <td class="px-6 py-4 text-gray-800 font-medium">TZS {{ number_format($order->total ?? 0) }}</td>
                            <td class="px-6 py-4">
                                @php
                                    $status = $order->status ?? 'pending';
                                    $colors = [
                                        'pending' => 'bg-amber-100 text-amber-700',
                                        'processing' => 'bg-blue-100 text-blue-700',
                                        'delivered' => 'bg-secondary/10 text-secondary',
                                        'cancelled' => 'bg-red-100 text-red-700',
                                    ];
                                    $labels = [
                                        'pending' => 'Inasubiri',
                                        'processing' => 'Inachakatwa',
                                        'delivered' => 'Imefikishwa',
                                        'cancelled' => 'Imefutwa',
                                    ];
                                @endphp
                                <span class="px-3 py-1 rounded-full text-xs font-medium {{ $colors[$status] ?? 'bg-gray-100 text-gray-700' }}">
                                    {{ $labels[$status] ?? $status }}
                                </span>
                            </td>
                            <td class="px-6 py-4 text-gray-500">{{ $order->created_at ? $order->created_at->format('d M Y') : '' }}</td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="5" class="px-6 py-12 text-center text-gray-400">
                                <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                                </svg>
                                <p>Hakuna maagizo bado.</p>
                            </td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>
</div>
@endsection
