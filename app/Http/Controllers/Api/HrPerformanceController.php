<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\PerformanceReview;
use App\Models\Business;
use Illuminate\Http\Request;

class HrPerformanceController extends Controller
{
    public function index(Request $request)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $reviews = PerformanceReview::whereHas('employee', fn($q) => $q->where('business_id', $businessId))
            ->with('employee:id,first_name,last_name,employee_number', 'reviewer:id,first_name,last_name')
            ->when($request->status, fn($q, $v) => $q->where('status', $v))
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 20);
        return response()->json($reviews);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:hr_employees,id',
            'reviewer_id' => 'required|exists:hr_employees,id',
            'review_period_start' => 'required|date',
            'review_period_end' => 'required|date|after_or_equal:review_period_start',
            'rating' => 'nullable|in:exceptional,exceeds,meets,needs_improvement,unsatisfactory',
            'strengths' => 'nullable|string',
            'areas_for_improvement' => 'nullable|string',
            'goals' => 'nullable|string',
            'comments' => 'nullable|string',
        ]);
        $validated['status'] = 'draft';
        $review = PerformanceReview::create($validated);
        return response()->json($review, 201);
    }

    public function show(Request $request, PerformanceReview $performanceReview)
    {
        return response()->json($performanceReview->load('employee', 'reviewer'));
    }

    public function update(Request $request, PerformanceReview $performanceReview)
    {
        $validated = $request->validate([
            'rating' => 'sometimes|in:exceptional,exceeds,meets,needs_improvement,unsatisfactory',
            'strengths' => 'nullable|string',
            'areas_for_improvement' => 'nullable|string',
            'goals' => 'nullable|string',
            'comments' => 'nullable|string',
            'status' => 'sometimes|in:draft,submitted,reviewed,acknowledged',
        ]);
        $performanceReview->update($validated);
        return response()->json($performanceReview);
    }

    public function destroy(Request $request, PerformanceReview $performanceReview)
    {
        $performanceReview->delete();
        return response()->json(['message' => 'Performance review deleted']);
    }
}
