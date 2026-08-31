<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\BusinessProject;
use Illuminate\Http\Request;

class BusinessProjectController extends Controller
{
    public function index(Request $request, Business $business)
    {
        $this->authorizeBusiness($request, $business);

        $request->validate([
            'status' => 'nullable|in:active,completed,cancelled',
            'search' => 'nullable|string|max:255',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        $projects = $business->businessProjects()
            ->when($request->status, fn ($q, $v) => $q->where('status', $v))
            ->when($request->search, fn ($q, $v) => $q->where('project_name', 'like', "%{$v}%"))
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 15);

        $summary = [
            'total' => $business->businessProjects()->count(),
            'active' => $business->businessProjects()->where('status', 'active')->count(),
            'completed' => $business->businessProjects()->where('status', 'completed')->count(),
            'total_capital' => (float) $business->businessProjects()->sum('required_capital'),
        ];

        return response()->json(array_merge($projects->toArray(), ['summary' => $summary]));
    }

    public function store(Request $request, Business $business)
    {
        $this->authorizeBusiness($request, $business);

        $validated = $request->validate([
            'project_name' => 'required|string|max:255',
            'required_capital' => 'required|numeric|min:0',
            'timeline_months' => 'required|integer|min:1',
            'available_capital' => 'nullable|numeric|min:0',
            'monthly_savings_capacity' => 'nullable|numeric|min:0',
            'start_date' => 'nullable|date',
            'notes' => 'nullable|string|max:1000',
        ]);

        $requiredCapital = (float) $validated['required_capital'];
        $timeline = (int) $validated['timeline_months'];
        $available = (float) ($validated['available_capital'] ?? 0);
        $gap = max(0, $requiredCapital - $available);

        $savingsNeeded = $timeline > 0 ? $gap / $timeline : 0;
        $savingsCapacity = isset($validated['monthly_savings_capacity'])
            ? (float) $validated['monthly_savings_capacity']
            : max($savingsNeeded, round(max(0, $gap) * 0.05, 2));

        $recommendedLoan = round(min($gap, $savingsCapacity * $timeline), 2);

        $allocation = config('mtai.project_allocation', [
            'investment' => 65,
            'life_insurance' => 20,
            'savings' => 5,
            'wallet' => 7,
            'bata' => 3,
        ]);

        $startDate = $validated['start_date'] ?? now()->toDateString();
        $completionDate = now()->parse($startDate)->addMonths($timeline)->toDateString();

        $project = $business->businessProjects()->create([
            'project_name' => $validated['project_name'],
            'required_capital' => $requiredCapital,
            'timeline_months' => $timeline,
            'completion_date' => $completionDate,
            'recommended_loan_amount' => $recommendedLoan,
            'savings_plan' => [
                'monthly_savings_needed' => round($savingsNeeded, 2),
                'monthly_savings_capacity' => round($savingsCapacity, 2),
                'expected_total_savings' => round($savingsCapacity * $timeline, 2),
                'capital_gap' => round($gap, 2),
            ],
            'allocation' => $allocation,
            'status' => 'active',
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json([
            'message' => 'Mradi umeundwa kwa mafanikio.',
            'project' => $project,
        ], 201);
    }

    public function estimate(Request $request, Business $business)
    {
        $this->authorizeBusiness($request, $business);

        $validated = $request->validate([
            'required_capital' => 'required|numeric|min:0',
            'timeline_months' => 'required|integer|min:1',
            'available_capital' => 'nullable|numeric|min:0',
            'monthly_savings_capacity' => 'nullable|numeric|min:0',
            'start_date' => 'nullable|date',
        ]);

        $requiredCapital = (float) $validated['required_capital'];
        $timeline = (int) $validated['timeline_months'];
        $available = (float) ($validated['available_capital'] ?? 0);
        $gap = max(0, $requiredCapital - $available);

        $savingsNeeded = $timeline > 0 ? $gap / $timeline : 0;
        $savingsCapacity = isset($validated['monthly_savings_capacity'])
            ? (float) $validated['monthly_savings_capacity']
            : max($savingsNeeded, round(max(0, $gap) * 0.05, 2));

        $recommendedLoan = round(min($gap, $savingsCapacity * $timeline), 2);
        $startDate = $validated['start_date'] ?? now()->toDateString();
        $completionDate = now()->parse($startDate)->addMonths($timeline)->toDateString();

        return response()->json([
            'estimate' => [
                'required_capital' => round($requiredCapital, 2),
                'available_capital' => round($available, 2),
                'capital_gap' => round($gap, 2),
                'timeline_months' => $timeline,
                'completion_date' => $completionDate,
                'savings_plan' => [
                    'monthly_savings_needed' => round($savingsNeeded, 2),
                    'monthly_savings_capacity' => round($savingsCapacity, 2),
                    'expected_total_savings' => round($savingsCapacity * $timeline, 2),
                ],
                'recommended_loan_amount' => $recommendedLoan,
                'allocation' => config('mtai.project_allocation', [
                    'investment' => 65,
                    'life_insurance' => 20,
                    'savings' => 5,
                    'wallet' => 7,
                    'bata' => 3,
                ]),
            ],
        ]);
    }

    public function show(Request $request, Business $business, BusinessProject $project)
    {
        $this->authorizeBusiness($request, $business);

        if ($project->business_id !== $business->id) {
            abort(403, 'Huna ruhusa ya kuona mradi huu.');
        }

        return response()->json(['project' => $project]);
    }

    public function update(Request $request, Business $business, BusinessProject $project)
    {
        $this->authorizeBusiness($request, $business);

        if ($project->business_id !== $business->id) {
            abort(403, 'Huna ruhusa kubadilisha mradi huu.');
        }

        $validated = $request->validate([
            'project_name' => 'sometimes|string|max:255',
            'status' => 'sometimes|in:active,completed,cancelled',
            'notes' => 'nullable|string|max:1000',
        ]);

        $project->update($validated);

        return response()->json([
            'message' => 'Mradi umesasishwa.',
            'project' => $project->fresh(),
        ]);
    }

    public function destroy(Request $request, Business $business, BusinessProject $project)
    {
        $this->authorizeBusiness($request, $business);

        if ($project->business_id !== $business->id) {
            abort(403, 'Huna ruhusa kufuta mradi huu.');
        }

        $project->delete();

        return response()->json(['message' => 'Mradi umefutwa.']);
    }

    protected function authorizeBusiness(Request $request, Business $business)
    {
        if ($business->user_id !== $request->user()->id) {
            abort(403, 'Huna ruhusa ya kufanya operesheni hii.');
        }
    }
}
