<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Delivery;
use App\Models\Transporter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TransporterController extends Controller
{
    public function dashboard(Request $request)
    {
        $transporter = $request->user()->transporter;

        if (!$transporter) {
            return response()->json(['message' => 'Msafirishaji hajapatikana.'], 404);
        }

        $pendingDeliveries = $transporter->deliveries()
            ->where('status', 'pending')
            ->whereNull('transporter_id')
            ->count();

        $activeDeliveries = $transporter->deliveries()
            ->whereIn('status', ['accepted', 'in_transit'])
            ->count();

        $completedDeliveries = $transporter->deliveries()
            ->where('status', 'delivered')
            ->count();

        $cancelledDeliveries = $transporter->deliveries()
            ->where('status', 'cancelled')
            ->count();

        $totalEarnings = $transporter->deliveries()
            ->where('status', 'delivered')
            ->sum('offered_price');

        $recentDeliveries = $transporter->deliveries()
            ->with(['business:id,business_name', 'customer:id,name,phone'])
            ->whereIn('status', ['accepted', 'in_transit', 'delivered'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        $availableDeliveries = Delivery::where('status', 'pending')
            ->whereNull('transporter_id')
            ->count();

        return response()->json([
            'transporter' => $transporter,
            'stats' => [
                'pending_deliveries' => $pendingDeliveries,
                'active_deliveries' => $activeDeliveries,
                'completed_deliveries' => $completedDeliveries,
                'cancelled_deliveries' => $cancelledDeliveries,
                'total_earnings' => number_format($totalEarnings, 2, '.', ''),
                'available_deliveries' => $availableDeliveries,
            ],
            'recent_deliveries' => $recentDeliveries,
        ]);
    }

    public function myDeliveries(Request $request)
    {
        $transporter = $request->user()->transporter;

        if (!$transporter) {
            return response()->json(['message' => 'Msafirishaji hajapatikana.'], 404);
        }

        $query = $transporter->deliveries()
            ->with([
                'order:id,transaction_code,total',
                'business:id,business_name',
                'customer:id,name,phone',
            ]);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('pickup_location', 'like', "%{$search}%")
                    ->orWhere('destination', 'like', "%{$search}%")
                    ->orWhere('item_description', 'like', "%{$search}%");
            });
        }

        return response()->json($query->orderBy('created_at', 'desc')->paginate(20));
    }

    public function updateDeliveryStatus(Request $request, Delivery $delivery)
    {
        $transporter = $request->user()->transporter;

        if (!$transporter) {
            return response()->json(['message' => 'Msafirishaji hajapatikana.'], 404);
        }

        if ($delivery->transporter_id !== $transporter->id) {
            return response()->json(['message' => 'Usafirishaji huu hauhusiani na wewe.'], 403);
        }

        $validated = $request->validate([
            'status' => 'required|in:accepted,in_transit,delivered',
        ]);

        $newStatus = $validated['status'];

        if (in_array($delivery->status, ['delivered', 'cancelled'])) {
            return response()->json(['message' => 'Hali ya usafirishaji haiwezi kubadilishwa zaidi.'], 422);
        }

        $validTransitions = [
            'pending' => ['accepted'],
            'accepted' => ['in_transit'],
            'in_transit' => ['delivered'],
        ];

        $allowed = $validTransitions[$delivery->status] ?? [];
        if (!in_array($newStatus, $allowed)) {
            return response()->json([
                'message' => "Hali ya usafirishaji haiwezi kubadilishwa kutoka '{$delivery->status}' hadi '{$newStatus}'.",
            ], 422);
        }

        $delivery->update(['status' => $newStatus]);

        $message = match ($newStatus) {
            'accepted' => 'Umekubali usafirishaji.',
            'in_transit' => 'Usafirishaji uko njiani.',
            'delivered' => 'Usafirishaji umekamilika.',
            default => 'Hali imesasishwa.',
        };

        return response()->json([
            'message' => $message,
            'delivery' => $delivery->fresh()->load([
                'order:id,transaction_code,total',
                'business:id,business_name',
                'customer:id,name,phone',
            ]),
        ]);
    }

    public function profile(Request $request)
    {
        $transporter = $request->user()->transporter;

        if (!$transporter) {
            return response()->json(['message' => 'Msafirishaji hajapatikana.'], 404);
        }

        $transporter->load('user:id,name,email,phone');

        return response()->json(['transporter' => $transporter]);
    }

    public function updateProfile(Request $request)
    {
        $transporter = $request->user()->transporter;

        if (!$transporter) {
            return response()->json(['message' => 'Msafirishaji hajapatikana.'], 404);
        }

        $validated = $request->validate([
            'vehicle_type' => 'sometimes|string|max:255',
            'plate_number' => 'sometimes|string|max:20',
            'is_active' => 'sometimes|boolean',
        ]);

        $transporter->update($validated);

        return response()->json([
            'message' => 'Wasifu umesasishwa.',
            'transporter' => $transporter->fresh()->load('user:id,name,email,phone'),
        ]);
    }
}
