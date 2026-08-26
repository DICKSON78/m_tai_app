<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Expense;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExpenseController extends Controller
{
    public function index(Request $request, Business $business)
    {
        $this->authorizeBusiness($request, $business);

        $query = $business->expenses()->with('recordedBy:id,name');

        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('date_from')) {
            $query->whereDate('date', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('date', '<=', $request->date_to);
        }

        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('description', 'like', "%{$request->search}%")
                    ->orWhere('category', 'like', "%{$request->search}%");
            });
        }

        $expenses = $query->orderBy('date', 'desc')->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 20);

        return response()->json($expenses);
    }

    public function store(Request $request, Business $business)
    {
        $this->authorizeBusiness($request, $business);

        $validated = $request->validate([
            'category' => 'required|in:breakfast,lunch,dinner,transport,drinks,rent,salaries,water,electricity,security,taxes,internet,charity,maintenance,other',
            'description' => 'nullable|string|max:1000',
            'amount' => 'required|numeric|min:0.01',
            'type' => 'required|in:daily,monthly',
            'date' => 'required|date',
        ]);

        $expense = Expense::create([
            'business_id' => $business->id,
            'category' => $validated['category'],
            'description' => $validated['description'] ?? null,
            'amount' => $validated['amount'],
            'type' => $validated['type'],
            'date' => $validated['date'],
            'recorded_by' => $request->user()->id,
        ]);

        return response()->json([
            'message' => 'Matumizi yamesajiliwa.',
            'expense' => $expense->load('recordedBy:id,name'),
        ], 201);
    }

    public function show(Request $request, Business $business, Expense $expense)
    {
        $this->authorizeBusiness($request, $business);

        if ($expense->business_id !== $business->id) {
            abort(403, 'Huna ruhusa ya kuona matumizi hii.');
        }

        $expense->load('recordedBy:id,name');

        return response()->json($expense);
    }

    public function update(Request $request, Business $business, Expense $expense)
    {
        $this->authorizeBusiness($request, $business);

        if ($expense->business_id !== $business->id) {
            abort(403, 'Huna ruhusa ya kubadilisha matumizi hii.');
        }

        $validated = $request->validate([
            'category' => 'sometimes|in:breakfast,lunch,dinner,transport,drinks,rent,salaries,water,electricity,security,taxes,internet,charity,maintenance,other',
            'description' => 'nullable|string|max:1000',
            'amount' => 'sometimes|numeric|min:0.01',
            'type' => 'sometimes|in:daily,monthly',
            'date' => 'sometimes|date',
        ]);

        $expense->update($validated);

        return response()->json([
            'message' => 'Matumizi yamesasishwa.',
            'expense' => $expense->fresh()->load('recordedBy:id,name'),
        ]);
    }

    public function destroy(Request $request, Business $business, Expense $expense)
    {
        $this->authorizeBusiness($request, $business);

        if ($expense->business_id !== $business->id) {
            abort(403, 'Huna ruhusa ya kufuta matumizi hii.');
        }

        $expense->delete();

        return response()->json(['message' => 'Matumizi yamefutwa.']);
    }

    public function summary(Request $request, Business $business)
    {
        $this->authorizeBusiness($request, $business);

        $request->validate([
            'period' => 'sometimes|in:daily,weekly,monthly,yearly',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
        ]);

        $period = $request->get('period', 'monthly');
        $dateFrom = $request->get('date_from', now()->startOfMonth()->toDateString());
        $dateTo = $request->get('date_to', now()->toDateString());

        $expenses = $business->expenses()
            ->whereDate('date', '>=', $dateFrom)
            ->whereDate('date', '<=', $dateTo);

        $groupByFormat = match ($period) {
            'daily' => '%Y-%m-%d',
            'weekly' => '%Y-W%u',
            'monthly' => '%Y-%m',
            'yearly' => '%Y',
            default => '%Y-%m',
        };

        $byPeriod = (clone $expenses)
            ->select(
                DB::raw("DATE_FORMAT(date, '{$groupByFormat}') as period"),
                DB::raw('SUM(amount) as total_amount'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('period')
            ->orderBy('period', 'desc')
            ->get();

        $byCategory = (clone $expenses)
            ->select(
                'category',
                DB::raw('SUM(amount) as total_amount'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('category')
            ->orderBy('total_amount', 'desc')
            ->get();

        $totalExpenses = (clone $expenses)->sum('amount');

        $dailyTotal = $business->expenses()
            ->whereDate('date', today())
            ->sum('amount');

        $monthlyTotal = $business->expenses()
            ->whereMonth('date', now()->month)
            ->whereYear('date', now()->year)
            ->sum('amount');

        return response()->json([
            'summary' => [
                'total_expenses' => (float) $totalExpenses,
                'daily_total' => (float) $dailyTotal,
                'monthly_total' => (float) $monthlyTotal,
                'period' => $period,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
            'by_period' => $byPeriod,
            'by_category' => $byCategory,
        ]);
    }

    protected function authorizeBusiness(Request $request, Business $business)
    {
        if ($business->user_id !== $request->user()->id) {
            abort(403, 'Huna ruhusa ya kufanya operesheni hii.');
        }
    }
}
