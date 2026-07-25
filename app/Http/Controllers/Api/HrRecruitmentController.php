<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\JobPosting;
use App\Models\JobApplication;
use App\Models\Business;
use Illuminate\Http\Request;

class HrRecruitmentController extends Controller
{
    public function index(Request $request)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $postings = JobPosting::where('business_id', $businessId)
            ->withCount('applications')
            ->when($request->status, fn($q, $v) => $q->where('status', $v))
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 20);
        return response()->json($postings);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'department_id' => 'nullable|exists:hr_departments,id',
            'employment_type' => 'sometimes|in:full_time,part_time,contract,intern',
            'salary_range' => 'nullable|string',
            'location' => 'nullable|string',
            'closing_date' => 'nullable|date',
        ]);
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $validated['business_id'] = $businessId;
        $validated['status'] = 'draft';
        $validated['applications_count'] = 0;
        $posting = JobPosting::create($validated);
        return response()->json($posting, 201);
    }

    public function show(Request $request, JobPosting $jobPosting)
    {
        return response()->json($jobPosting->load('applications', 'department:id,name'));
    }

    public function update(Request $request, JobPosting $jobPosting)
    {
        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'status' => 'sometimes|in:draft,open,closed,cancelled',
        ]);
        $jobPosting->update($validated);
        return response()->json($jobPosting);
    }

    public function applications(Request $request, JobPosting $jobPosting)
    {
        $applications = $jobPosting->applications()
            ->when($request->status, fn($q, $v) => $q->where('status', $v))
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 20);
        return response()->json($applications);
    }

    public function storeApplication(Request $request, JobPosting $jobPosting)
    {
        $validated = $request->validate([
            'candidate_name' => 'required|string|max:255',
            'candidate_email' => 'required|email|max:255',
            'candidate_phone' => 'nullable|string',
            'cover_letter' => 'nullable|string',
        ]);
        $validated['job_posting_id'] = $jobPosting->id;
        $validated['status'] = 'pending';
        $jobPosting->increment('applications_count');
        $application = JobApplication::create($validated);
        return response()->json($application, 201);
    }

    public function updateApplication(Request $request, JobApplication $jobApplication)
    {
        $validated = $request->validate([
            'status' => 'sometimes|in:pending,reviewed,shortlisted,interview,hired,rejected',
            'notes' => 'nullable|string',
        ]);
        $jobApplication->update($validated);
        return response()->json($jobApplication);
    }

    public function destroy(Request $request, JobPosting $jobPosting)
    {
        $jobPosting->applications()->delete();
        $jobPosting->delete();
        return response()->json(['message' => 'Job posting deleted']);
    }
}
