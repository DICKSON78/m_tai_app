<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Customer;
use App\Models\Delivery;
use App\Models\Transporter;
use Illuminate\Http\Request;

class DeliveryController extends Controller
{
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
        ]);

        if (! empty($validated['order_id'])) {
            $order = $business->orders()->find($validated['order_id']);
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
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Ofa ya usafirishaji imetolewa.',
            'delivery' => $delivery->load([
                'order:id,transaction_code,total',
                'customer:id,full_name,phone',
            ]),
        ], 201);
    }

    public function show(Request $request, Business $business, Delivery $delivery)
    {
        if ($business->user_id !== $request->user()->id) {
            abort(403);
        }

        if ($delivery->business_id !== $business->id) {
            abort(404);
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

        $delivery->update([
            'transporter_id' => $transporter->id,
            'status' => 'accepted',
        ]);

        if ($transporter->user) {
            PushNotificationController::sendNotification(
                $transporter->user,
                'Delivery assigned',
                "Umepewa usafirishaji mpya kutoka {$delivery->pickup_location} kwenda {$delivery->destination}.",
                [
                    'type' => 'delivery_status',
                    'delivery_id' => $delivery->id,
                    'status' => 'accepted',
                ]
            );
        }

        return response()->json([
            'message' => 'Msafirishaji ameajiriwa.',
            'delivery' => $delivery->fresh()->load([
                'order:id,transaction_code,total',
                'customer:id,full_name,phone',
                'transporter:id,full_name,phone,vehicle_type,plate_number',
            ]),
        ]);
    }

    public function available(Request $request)
    {
        $deliveries = Delivery::where('status', 'pending')
            ->whereNull('transporter_id')
            ->with([
                'business:id,business_name',
                'customer:id,full_name,phone',
            ])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($deliveries);
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
}
