<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\NotificationMail;
use App\Models\UserNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class NotificationController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'type' => 'nullable|string|max:50',
            'send_email' => 'nullable|boolean',
        ]);

        $notification = $request->user()->notifications()->create([
            'title' => $validated['title'],
            'message' => $validated['message'],
            'type' => $validated['type'] ?? 'general',
            'is_read' => false,
        ]);

        if (!empty($validated['send_email']) && $request->user()->email) {
            try {
                Mail::to($request->user()->email)->send(
                    new NotificationMail($request->user()->name, $validated['title'], $validated['message'])
                );
            } catch (\Exception $e) {
                \Log::error('Failed to send notification email: ' . $e->getMessage());
            }
        }

        return response()->json($notification, 201);
    }

    public function index(Request $request)
    {
        $query = $request->user()->notifications();

        if ($request->has('read')) {
            $query->where('is_read', $request->boolean('read'));
        }

        return response()->json($query->orderBy('created_at', 'desc')->paginate(20));
    }

    public function markRead(Request $request, UserNotification $notification)
    {
        if ($notification->user_id !== $request->user()->id) {
            abort(404);
        }

        $request->validate([
            'is_read' => 'nullable|boolean',
        ], [
            'is_read.boolean' => 'Thamani ya usomaji si sahihi.',
        ]);

        $notification->update(['is_read' => true, 'read_at' => now()]);

        return response()->json(['message' => 'Taarifa imesomwa.']);
    }

    public function markAllRead(Request $request)
    {
        $request->user()->notifications()
            ->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);

        return response()->json(['message' => 'Taarifa zote zimesomwa.']);
    }

    public function unreadCount(Request $request)
    {
        $count = $request->user()->notifications()->where('is_read', false)->count();

        return response()->json(['unread_count' => $count]);
    }

    public function destroy(Request $request, UserNotification $notification)
    {
        if ($notification->user_id !== $request->user()->id) {
            abort(404);
        }

        $notification->delete();

        return response()->json(['message' => 'Taarifa imeondolewa.']);
    }
}
