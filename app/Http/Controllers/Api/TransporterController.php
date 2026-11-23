<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Delivery;
use App\Models\Transporter;
use App\Services\DeliveryDispatchService;
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

        $incomingOffers = Delivery::where('transporter_id', $transporter->id)
            ->where('status', 'pending')
            ->where(function ($query) {
                $query->whereNull('offer_expires_at')
                    ->orWhere('offer_expires_at', '>', now());
            })
            ->count();

        return response()->json([
            'transporter' => $transporter,
            'is_online' => (bool) $transporter->is_online,
            'stats' => [
                'pending_deliveries' => $pendingDeliveries,
                'active_deliveries' => $activeDeliveries,
                'completed_deliveries' => $completedDeliveries,
                'cancelled_deliveries' => $cancelledDeliveries,
                'total_earnings' => number_format($totalEarnings, 2, '.', ''),
                'available_deliveries' => $availableDeliveries,
                'incoming_offers' => $incomingOffers,
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
                'customer:id,full_name,phone',
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

        $delivery->update(array_filter([
            'status' => $newStatus,
            'accepted_at' => $newStatus === 'accepted' ? now() : null,
        ]));

        if ($newStatus === 'in_transit' && $delivery->customer && $delivery->customer->user) {
            PushNotificationController::sendNotification(
                $delivery->customer->user,
                'Mzigo uko njiani',
                "Mzigo wako umechukuliwa na uko njiani kwenda {$delivery->destination}.",
                [
                    'type' => 'delivery_update',
                    'status' => $newStatus,
                    'delivery_id' => $delivery->id,
                    'link' => "/delivery-tracking?id={$delivery->id}",
                ]
            );
        }

        if ($newStatus === 'delivered' && $delivery->customer && $delivery->customer->user) {
            PushNotificationController::sendNotification(
                $delivery->customer->user,
                'Mzigo umefika',
                "Usafirishaji umekamilika na umefika {$delivery->destination}.",
                [
                    'type' => 'delivery_update',
                    'status' => $newStatus,
                    'delivery_id' => $delivery->id,
                    'link' => "/delivery-tracking?id={$delivery->id}",
                ]
            );
        }

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
                'customer:id,full_name,phone',
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
        $user = $transporter->user;

        // Flat keys keep the existing mobile profile screen working while the
        // nested `transporter` payload remains available for other clients.
        return response()->json([
            'transporter' => $transporter,
            'id' => $transporter->id,
            'name' => $user ? $user->name : $transporter->full_name,
            'email' => $user ? $user->email : null,
            'phone' => $transporter->phone ?: ($user ? $user->phone : null),
            'vehicle_type' => $transporter->vehicle_type,
            'vehicle_plate' => $transporter->plate_number,
            'plate_number' => $transporter->plate_number,
            'region' => $transporter->region,
            'is_online' => (bool) $transporter->is_online,
            'is_available' => (bool) $transporter->is_online,
            'is_active' => (bool) $transporter->is_active,
            'rating' => (float) $transporter->ratings,
            'latitude' => $transporter->latitude !== null ? (float) $transporter->latitude : null,
            'longitude' => $transporter->longitude !== null ? (float) $transporter->longitude : null,
        ]);
    }

    /** Called periodically by the driver app so dispatch can match the nearest driver. */
    public function updateLocation(Request $request)
    {
        $transporter = $request->user()->transporter;

        if (!$transporter) {
            return response()->json(['message' => 'Msafirishaji hajapatikana.'], 404);
        }

        $validated = $request->validate([
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'is_online' => 'sometimes|boolean',
        ]);

        $transporter->update([
            'latitude' => $validated['latitude'],
            'longitude' => $validated['longitude'],
            'last_location_at' => now(),
            'is_online' => $validated['is_online'] ?? $transporter->is_online,
        ]);

        // A load created while this driver was offline can be handed over now.
        app(DeliveryDispatchService::class)->offerPendingFor($transporter->fresh());

        return response()->json([
            'message' => 'Eneo limesasishwa.',
            'latitude' => (float) $transporter->latitude,
            'longitude' => (float) $transporter->longitude,
            'is_online' => (bool) $transporter->is_online,
        ]);
    }

    /** Toggle whether the driver should receive new load offers. */
    public function setAvailability(Request $request)
    {
        $transporter = $request->user()->transporter;

        if (!$transporter) {
            return response()->json(['message' => 'Msafirishaji hajapatikana.'], 404);
        }

        $validated = $request->validate([
            'is_online' => 'required_without:is_available|boolean',
            'is_available' => 'required_without:is_online|boolean',
        ]);

        $online = $validated['is_online'] ?? $validated['is_available'];

        $transporter->update(['is_online' => $online]);

        if ($online) {
            app(DeliveryDispatchService::class)->offerPendingFor($transporter->fresh());
        }

        return response()->json([
            'message' => $online
                ? 'Uko mtandaoni. Utapokea ofa za mzigo.'
                : 'Umekaa mbali na mtandao. Hutapokea ofa mpya.',
            'is_online' => (bool) $transporter->is_online,
            'is_available' => (bool) $transporter->is_online,
        ]);
    }

    public function stats(Request $request)
    {
        $transporter = $request->user()->transporter;

        if (!$transporter) {
            return response()->json(['message' => 'Msafirishaji hajapatikana.'], 404);
        }

        $deliveries = $transporter->deliveries();

        return response()->json([
            'total_deliveries' => (clone $deliveries)->count(),
            'completed' => (clone $deliveries)->where('status', 'delivered')->count(),
            'in_transit' => (clone $deliveries)->where('status', 'in_transit')->count(),
            'pending' => (clone $deliveries)->where('status', 'pending')->count(),
        ]);
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
            'vehicle_plate' => 'sometimes|string|max:20',
            'is_active' => 'sometimes|boolean',
            'is_online' => 'sometimes|boolean',
            'is_available' => 'sometimes|boolean',
            'region' => 'nullable|string|max:255',
        ]);

        if (array_key_exists('is_available', $validated)) {
            $validated['is_online'] = $validated['is_available'];
            unset($validated['is_available']);
        }

        if (array_key_exists('vehicle_plate', $validated)) {
            $validated['plate_number'] = $validated['vehicle_plate'];
            unset($validated['vehicle_plate']);
        }

        $transporter->update($validated);

        return response()->json([
            'message' => 'Wasifu umesasishwa.',
            'transporter' => $transporter->fresh()->load('user:id,name,email,phone'),
        ]);
    }
}
