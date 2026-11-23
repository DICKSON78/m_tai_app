<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Customer;
use App\Models\Delivery;
use App\Models\Transporter;
use App\Services\DeliveryDispatchService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DeliveryController extends Controller
{
    private function dispatch(): DeliveryDispatchService
    {
        return app(DeliveryDispatchService::class);
    }

    private function loadRelations(Delivery $delivery): Delivery
    {
        return $delivery->load([
            'order:id,transaction_code,total',
            'business:id,business_name',
            'customer:id,full_name,phone',
            'transporter:id,full_name,phone,vehicle_type,plate_number',
        ]);
    }

    public function index(Request $request, Business $business)
    {
        if ($business->user_id !== $request->user()->id) {
            abort(403);
        }

        $query = $business->deliveries()
            ->with([
                'order:id,transaction_code,total',
                'customer:id,full_name,phone',
                'transporter:id,full_name,phone',
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

    public function store(Request $request, Business $business)
    {
        if ($business->user_id !== $request->user()->id) {
            abort(403);
        }

        $validated = $request->validate([
            'order_id' => 'nullable|exists:orders,id',
            'customer_id' => 'required|exists:customers,id',
            'goods_category' => 'required|string|max:255',
            'item_description' => 'required|string|max:1000',
            'quantity' => 'required|integer|min:1',
            'pickup_location' => 'required|string|max:500',
            'destination' => 'required|string|max:500',
            'offered_price' => 'required|numeric|min:0',
            'is_negotiable' => 'sometimes|boolean',
            'pickup_latitude' => 'nullable|numeric|between:-90,90',
            'pickup_longitude' => 'nullable|numeric|between:-180,180',
        ]);

        if (! empty($validated['order_id'])) {
            $order = $business->orders()->where('id', $validated['order_id'])->where('customer_id', $validated['customer_id'])->first();
            if (! $order) {
                return response()->json(['message' => 'Agizo hilo halihusiani na biashara hii.'], 422);
            }
        }

        $delivery = $business->deliveries()->create([
            'order_id' => $validated['order_id'] ?? null,
            'customer_id' => $validated['customer_id'],
            'goods_category' => $validated['goods_category'],
            'item_description' => $validated['item_description'],
            'quantity' => $validated['quantity'],
            'pickup_location' => $validated['pickup_location'],
            'destination' => $validated['destination'],
            'offered_price' => $validated['offered_price'],
            'is_negotiable' => $validated['is_negotiable'] ?? true,
            'pickup_latitude' => $validated['pickup_latitude'] ?? null,
            'pickup_longitude' => $validated['pickup_longitude'] ?? null,
            'status' => 'pending',
        ]);

        // Uber/Bolt style: alert the nearest online transporter immediately.
        $offered = $this->dispatch()->offer($delivery);

        return response()->json([
            'message' => 'Ofa ya usafirishaji imetolewa.',
            'offered' => $offered,
            'delivery' => $this->loadRelations($delivery),
        ], 201);
    }

    public function show(Request $request, ?Business $business = null, ?Delivery $delivery = null)
    {
        if (! $delivery) {
            abort(404);
        }

        if ($business) {
            if ($business->user_id !== $request->user()->id) {
                abort(403);
            }

            if ($delivery->business_id !== $business->id) {
                abort(404);
            }
        } else {
            $user = $request->user();
            $isOwner = $user->businesses()->whereKey($delivery->business_id)->exists();
            $isAssignedTransporter = $user->transporter && $delivery->transporter_id === $user->transporter->id;
            $isCustomer = $delivery->customer && $delivery->customer->user_id === $user->id;

            if (! $isOwner && ! $isAssignedTransporter && ! $isCustomer && $user->role !== 'admin') {
                abort(403);
            }
        }

        return response()->json($delivery->load([
            'order:id,transaction_code,total',
            'customer:id,full_name,phone',
            'transporter:id,full_name,phone,vehicle_type,plate_number',
        ]));
    }

    public function update(Request $request, Business $business, Delivery $delivery)
    {
        if ($business->user_id !== $request->user()->id) {
            abort(403);
        }

        if ($delivery->business_id !== $business->id) {
            abort(404);
        }

        if (in_array($delivery->status, ['delivered', 'cancelled'])) {
            return response()->json(['message' => 'Usafirishaji hauwezi kusasishwa kwa kuwa umekamilika au umefutwa.'], 422);
        }

        $validated = $request->validate([
            'pickup_location' => 'sometimes|string|max:500',
            'destination' => 'sometimes|string|max:500',
            'offered_price' => 'sometimes|numeric|min:0',
            'is_negotiable' => 'sometimes|boolean',
            'goods_category' => 'sometimes|string|max:255',
            'item_description' => 'sometimes|string|max:1000',
            'pickup_latitude' => 'nullable|numeric|between:-90,90',
            'pickup_longitude' => 'nullable|numeric|between:-180,180',
        ]);

        $delivery->update($validated);

        return response()->json([
            'message' => 'Usafirishaji umesasishwa.',
            'delivery' => $delivery->fresh()->load([
                'order:id,transaction_code,total',
                'customer:id,full_name,phone',
                'transporter:id,full_name,phone',
            ]),
        ]);
    }

    public function status(Request $request, Business $business, Delivery $delivery)
    {
        if ($business->user_id !== $request->user()->id) {
            abort(403);
        }

        if ($delivery->business_id !== $business->id) {
            abort(404);
        }

        $validated = $request->validate([
            'status' => 'required|in:accepted,in_transit,delivered,cancelled',
        ]);

        $newStatus = $validated['status'];

        if (in_array($delivery->status, ['delivered', 'cancelled'])) {
            return response()->json(['message' => 'Hali ya usafirishaji haiwezi kubadilishwa zaidi.'], 422);
        }

        $validTransitions = [
            'pending' => ['accepted', 'cancelled'],
            'accepted' => ['in_transit', 'cancelled'],
            'in_transit' => ['delivered', 'cancelled'],
        ];

        $allowed = $validTransitions[$delivery->status] ?? [];
        if (! in_array($newStatus, $allowed)) {
            return response()->json([
                'message' => "Hali ya usafirishaji haiwezi kubadilishwa kutoka '{$delivery->status}' hadi '{$newStatus}'.",
            ], 422);
        }

        $delivery->update(['status' => $newStatus]);

        if ($newStatus === 'in_transit' && $delivery->customer && $delivery->customer->user) {
            PushNotificationController::sendNotification(
                $delivery->customer->user,
                'Delivery picked up',
                "Bidhaa zako zimechukuliwa na ziko njiani kwenda {$delivery->destination}.",
                [
                    'type' => 'delivery_status',
                    'delivery_id' => $delivery->id,
                    'status' => $newStatus,
                ]
            );
        }

        if ($newStatus === 'delivered' && $delivery->customer && $delivery->customer->user) {
            PushNotificationController::sendNotification(
                $delivery->customer->user,
                'Delivered',
                "Usafirishaji umekamilika na umefika {$delivery->destination}.",
                [
                    'type' => 'delivery_status',
                    'delivery_id' => $delivery->id,
                    'status' => $newStatus,
                ]
            );
        }

        return response()->json([
            'message' => 'Hali ya usafirishaji imesasishwa.',
            'delivery' => $delivery->fresh()->load([
                'order:id,transaction_code,total',
                'customer:id,full_name,phone',
                'transporter:id,full_name,phone',
            ]),
        ]);
    }

    public function transporters(Request $request, Business $business)
    {
        if ($business->user_id !== $request->user()->id) {
            abort(403);
        }

        $transporters = Transporter::where('is_active', true)
            ->orderBy('full_name')
            ->get(['id', 'full_name', 'phone', 'vehicle_type', 'plate_number']);

        return response()->json(['data' => $transporters]);
    }

    public function assignTransporter(Request $request, Business $business, Delivery $delivery)
    {
        if ($business->user_id !== $request->user()->id) {
            abort(403);
        }

        if ($delivery->business_id !== $business->id) {
            abort(404);
        }

        if ($delivery->status !== 'pending') {
            return response()->json(['message' => 'Msafirishaji anaweza kuajiriwa tu kwa usafirishaji unaosubiri.'], 422);
        }

        $validated = $request->validate([
            'transporter_id' => 'required|exists:transporters,id',
        ]);

        $transporter = Transporter::findOrFail($validated['transporter_id']);

        if (! $transporter->is_active) {
            return response()->json(['message' => 'Msafirishaji si hai.'], 422);
        }

        // Reassigning replaces any offer that was still waiting for a response.
        if ($delivery->transporter_id !== null) {
            $delivery->update([
                'transporter_id' => null,
                'offered_at' => null,
                'offer_expires_at' => null,
            ]);
        }

        $offered = $this->dispatch()->offer($delivery->fresh(), [], $transporter);

        if (! $offered) {
            return response()->json([
                'message' => 'Ofa haiwezi kutolewa kwa msafirishaji huyu kwa sasa. Tafadhali jaribu tena.',
            ], 422);
        }

        return response()->json([
            'message' => 'Ofa imetumwa kwa msafirishaji. Inasubiri kukubaliwa.',
            'offered' => true,
            'delivery' => $this->loadRelations($delivery->fresh()),
        ]);
    }

    public function available(Request $request)
    {
        $this->dispatch()->expireStaleOffers(true);

        $deliveries = Delivery::where('status', 'pending')
            ->whereNull('transporter_id')
            ->with([
                'business:id,business_name',
                'customer:id,full_name,phone',
                'order:id,transaction_code,total',
            ])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($deliveries);
    }

    /** Offers currently reserved for the signed-in transporter (the Uber/Bolt request screen). */
    public function offers(Request $request)
    {
        $transporter = $request->user()->transporter;

        if (! $transporter) {
            return response()->json(['message' => 'Msafirishaji hajapatikana.'], 404);
        }

        $this->dispatch()->expireStaleOffers(true);

        $offers = Delivery::where('transporter_id', $transporter->id)
            ->where('status', 'pending')
            ->where(function ($query) {
                $query->whereNull('offer_expires_at')
                    ->orWhere('offer_expires_at', '>', now());
            })
            ->with([
                'order:id,transaction_code,total',
                'business:id,business_name',
                'customer:id,full_name,phone',
            ])
            ->orderBy('offered_at', 'desc')
            ->get();

        return response()->json(['data' => $offers]);
    }

    public function customerDeliveries(Request $request)
    {
        $user = $request->user();
        $customer = Customer::where('user_id', $user->id)->first();

        if (! $customer) {
            return response()->json(['data' => []]);
        }

        $deliveries = Delivery::where('customer_id', $customer->id)
            ->with([
                'order:id,transaction_code,total',
                'transporter:id,full_name,phone',
                'business:id,business_name',
            ])
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json($deliveries);
    }

    public function availableDeliveries(Request $request)
    {
        return $this->available($request);
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

        return response()->json($query->orderBy('created_at', 'desc')->paginate(20));
    }

    public function acceptDelivery(Request $request, Delivery $delivery)
    {
        $transporter = $request->user()->transporter;

        if (!$transporter) {
            return response()->json(['message' => 'Msafirishaji hajapatikana.'], 404);
        }

        $result = DB::transaction(function () use ($delivery, $transporter) {
            $locked = Delivery::whereKey($delivery->id)->lockForUpdate()->first();

            if (! $locked) {
                return 'missing';
            }

            if ($locked->status !== 'pending') {
                return 'unavailable';
            }

            $isOfferedToMe = $locked->transporter_id === $transporter->id;
            $isOpenPoolClaim = $locked->transporter_id === null;

            if (! $isOfferedToMe && ! $isOpenPoolClaim) {
                return 'unavailable';
            }

            if ($isOfferedToMe && $locked->offer_expires_at && $locked->offer_expires_at->isPast()) {
                return 'expired';
            }

            $locked->update([
                'transporter_id' => $transporter->id,
                'status' => 'accepted',
                'accepted_at' => now(),
                'offered_at' => null,
                'offer_expires_at' => null,
                'auto_dispatched' => true,
            ]);

            return $locked;
        });

        if ($result === 'missing') {
            abort(404);
        }

        if (is_string($result)) {
            return response()->json([
                'message' => $result === 'expired'
                    ? 'Muda wa ofa umekwisha. Mzigo umetolewa kwa dereva mwingine.'
                    : 'Usafirishaji huu haupatikani tena.',
            ], 422);
        }

        if ($result->business && $result->business->user) {
            PushNotificationController::sendNotification(
                $result->business->user,
                'Dereva amekubali',
                "{$transporter->full_name} amekubali kusafirisha mzigo kutoka {$result->pickup_location} kwenda {$result->destination}.",
                [
                    'type' => 'delivery_update',
                    'status' => 'accepted',
                    'delivery_id' => $result->id,
                    'link' => "/owner/deliveries?id={$result->id}",
                ]
            );
        }

        return response()->json([
            'message' => 'Umekubali usafirishaji.',
            'delivery' => $this->loadRelations($result),
        ]);
    }

    public function rejectDelivery(Request $request, Delivery $delivery)
    {
        $transporter = $request->user()->transporter;

        if (!$transporter) {
            return response()->json(['message' => 'Msafirishaji hajapatikana.'], 404);
        }

        $validated = $request->validate([
            'reason' => 'nullable|string|max:1000',
        ]);

        $result = DB::transaction(function () use ($delivery, $transporter, $validated) {
            $locked = Delivery::whereKey($delivery->id)->lockForUpdate()->first();

            if (! $locked) {
                return 'missing';
            }

            if (in_array($locked->status, ['delivered', 'cancelled'])) {
                return 'final';
            }

            if ($locked->transporter_id !== $transporter->id) {
                return 'not_offered';
            }

            $locked->update([
                'transporter_id' => null,
                'offered_at' => null,
                'offer_expires_at' => null,
                'auto_dispatched' => false,
                'rejected' => true,
                'rejected_reason' => $validated['reason'] ?? null,
                'rejected_by' => $transporter->id,
            ]);

            return $locked;
        });

        if ($result === 'missing') {
            abort(404);
        }

        if (is_string($result)) {
            return response()->json([
                'message' => $result === 'final'
                    ? 'Usafirishaji huu hauwezi kukataliwa.'
                    : 'Ofa hii haisubiri majibu yako.',
            ], 422);
        }

        // Immediately pass the load to the next closest available transporter.
        $reoffered = false;
        try {
            $reoffered = $this->dispatch()->offer($result->fresh(), [$transporter->id]);
        } catch (\Throwable $exception) {
            Log::warning('Delivery re-offer failed', ['delivery' => $result->id, 'error' => $exception->getMessage()]);
        }

        if ($result->business && $result->business->user) {
            PushNotificationController::sendNotification(
                $result->business->user,
                $reoffered ? 'Ofa ilikataliwa - dereva mwingine amepewa' : 'Ofa ilikataliwa',
                $reoffered
                    ? 'Dereva amekataa ofa. Mzigo umetolewa kwa dereva mwingine aliye karibu.'
                    : 'Dereva amekataa ofa ya usafirishaji. Hakuna dereva mwingine aliye karibu kwa sasa.',
                [
                    'type' => 'delivery_status',
                    'delivery_id' => $result->id,
                    'status' => 'rejected',
                ]
            );
        }

        return response()->json([
            'message' => $reoffered
                ? 'Umekataa usafirishaji. Mzigo umetolewa kwa dereva mwingine.'
                : 'Umekataa usafirishaji.',
            'reoffered' => $reoffered,
            'delivery' => $this->loadRelations($result->fresh()),
        ]);
    }

    public function negotiateDelivery(Request $request, Delivery $delivery)
    {
        $transporter = $request->user()->transporter;

        if (!$transporter) {
            return response()->json(['message' => 'Msafirishaji hajapatikana.'], 404);
        }

        if ($delivery->status !== 'pending'
            || ($delivery->transporter_id !== null && $delivery->transporter_id !== $transporter->id)) {
            return response()->json(['message' => 'Usafirishaji huu hauko katika hatua ya mazungumzo.'], 422);
        }

        if (! $delivery->is_negotiable) {
            return response()->json(['message' => 'Ofa hii haikubali mazungumzo ya bei.'], 422);
        }

        $validated = $request->validate([
            'counter_price' => 'required|numeric|min:0',
        ]);

        $delivery->update([
            'counter_price' => $validated['counter_price'],
            'counter_status' => 'requested',
        ]);

        if ($delivery->business && $delivery->business->user) {
            PushNotificationController::sendNotification(
                $delivery->business->user,
                'Price negotiation',
                "Msafirishaji amependekeza bei mpya ya " . number_format($validated['counter_price'], 2) . " TZS.",
                [
                    'type' => 'delivery_negotiation',
                    'delivery_id' => $delivery->id,
                    'counter_price' => $validated['counter_price'],
                ]
            );
        }

        return response()->json([
            'message' => 'Umependekeza bei yako ya mazungumzo.',
            'delivery' => $delivery->fresh()->load([
                'order:id,transaction_code,total',
                'business:id,business_name',
                'customer:id,full_name,phone',
            ]),
        ]);
    }

    public function respondToNegotiation(Request $request, Business $business, Delivery $delivery)
    {
        if ($business->user_id !== $request->user()->id) {
            abort(403);
        }

        if ($delivery->business_id !== $business->id) {
            abort(404);
        }

        if (is_null($delivery->counter_price) || $delivery->counter_status !== 'requested') {
            return response()->json(['message' => 'Hakuna ombi la mazungumzo linalosubiri.'], 422);
        }

        $validated = $request->validate([
            'decision' => 'required|in:accept,decline',
        ]);

        if ($validated['decision'] === 'accept') {
            $delivery->update([
                'offered_price' => $delivery->counter_price,
                'counter_status' => 'accepted',
            ]);
            $message = 'Umeikubali bei ya mazungumzo.';

            if ($delivery->transporter && $delivery->transporter->user) {
                PushNotificationController::sendNotification(
                    $delivery->transporter->user,
                    'Negotiation accepted',
                    'Bei yako ya mazungumzo imekubaliwa.',
                    [
                        'type' => 'delivery_negotiation',
                        'delivery_id' => $delivery->id,
                    ]
                );
            }
        } else {
            $delivery->update(['counter_status' => 'declined']);
            $message = 'Umekataa bei ya mazungumzo.';
        }

        return response()->json([
            'message' => $message,
            'delivery' => $delivery->fresh()->load([
                'order:id,transaction_code,total',
                'customer:id,full_name,phone',
                'transporter:id,full_name,phone',
            ]),
        ]);
    }

    public function updateStatus(Request $request, Delivery $delivery)
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

        return response()->json([
            'message' => 'Hali ya usafirishaji imesasishwa.',
            'delivery' => $this->loadRelations($delivery->fresh()),
        ]);
    }
}
