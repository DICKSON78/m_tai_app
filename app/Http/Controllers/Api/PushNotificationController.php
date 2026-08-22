<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PushSubscription;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PushNotificationController extends Controller
{
    private const EXPO_API_URL = 'https://exp.host/--/api/v2/push/send';

    public function subscribe(Request $request)
    {
        $validated = $request->validate([
            'token' => 'required|string',
            'platform' => 'required|in:ios,android,web',
            'device_name' => 'nullable|string|max:255',
        ]);

        $subscription = PushSubscription::updateOrCreate(
            [
                'user_id' => $request->user()->id,
                'endpoint' => $validated['token'],
            ],
            [
                'platform' => $validated['platform'],
                'device_name' => $validated['device_name'] ?? null,
                'is_active' => true,
                'last_used_at' => now(),
            ]
        );

        return response()->json([
            'message' => 'Push subscription imesajiliwa.',
            'subscription' => $subscription,
        ], 201);
    }

    public function unsubscribe(Request $request)
    {
        $validated = $request->validate([
            'token' => 'required|string',
        ]);

        $deleted = PushSubscription::where('user_id', $request->user()->id)
            ->where('endpoint', $validated['token'])
            ->delete();

        if (! $deleted) {
            return response()->json(['message' => 'Push subscription haipatikani.'], 404);
        }

        return response()->json(['message' => 'Push subscription imeondolewa.']);
    }

    public function testPush(Request $request)
    {
        $sent = self::sendNotification(
            $request->user(),
            'Taarifa ya Majaribio',
            'Hii ni taarifa ya majaribio kutoka M-TAI.',
            ['type' => 'test']
        );

        if (! $sent) {
            return response()->json(['message' => 'Hauna kifaa kilichosajiliwa au taarifa imeshindikana kutumwa.'], 422);
        }

        return response()->json(['message' => 'Taarifa ya majaribio imetumwa.']);
    }

    public static function sendNotification(User $user, string $title, string $body, array $data = [])
    {
        $subscriptions = PushSubscription::where('user_id', $user->id)
            ->where('is_active', true)
            ->get();

        if ($subscriptions->isEmpty()) {
            return false;
        }

        $messages = $subscriptions->map(fn (PushSubscription $subscription) => [
            'to' => $subscription->endpoint,
            'title' => $title,
            'body' => $body,
            'data' => $data,
            'sound' => 'default',
            'badge' => 1,
        ])->values()->all();

        try {
            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ])->post(self::EXPO_API_URL, $messages);

            if ($response->successful()) {
                $subscriptions->each(fn (PushSubscription $subscription) => $subscription->update(['last_used_at' => now()]));

                return true;
            }

            Log::warning('Expo push failed', ['response' => $response->json()]);

            return false;
        } catch (\Exception $e) {
            Log::error('Push notification failed: '.$e->getMessage());

            return false;
        }
    }
}
