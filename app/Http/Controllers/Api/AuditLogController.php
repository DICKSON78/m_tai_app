<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'user_id' => 'nullable|integer|exists:users,id',
            'action' => 'nullable|string|max:255',
            'model_type' => 'nullable|string|max:255',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
            'search' => 'nullable|string|max:255',
            'per_page' => 'nullable|integer|min:1|max:100',
            'page' => 'nullable|integer|min:1',
        ], [
            'user_id.exists' => 'Mtumiaji huyu haipatikani.',
            'date_from.date' => 'Tarehe ya kuanza si sahihi.',
            'date_to.date' => 'Tarehe ya mwisho si sahihi.',
            'date_to.after_or_equal' => 'Tarehe ya mwisho lazima iwe sawa au baada ya tarehe ya kuanza.',
            'per_page.max' => 'Idadi ya kurasa kwa ukurasa haizidi 100.',
        ]);

        $query = AuditLog::with('user:id,name,email');

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->has('action')) {
            $query->where('action', 'like', "%{$request->action}%");
        }

        if ($request->has('model_type')) {
            $query->where('model_type', $request->model_type);
        }

        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhere('action', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        $paginated = $query->orderBy('created_at', 'desc')->paginate(30);

        $summary = [
            'total' => AuditLog::count(),
            'today' => AuditLog::whereDate('created_at', today())->count(),
            'this_week' => AuditLog::where('created_at', '>=', now()->startOfWeek())->count(),
        ];

        return response()->json(['data' => $paginated->items(), 'summary' => $summary, 'current_page' => $paginated->currentPage(), 'last_page' => $paginated->lastPage(), 'total' => $paginated->total()]);
    }

    public function destroy(AuditLog $auditLog)
    {
        $auditLog->delete();
        return response()->json(['message' => 'Log ya kitendo imeondolewa.']);
    }
}
