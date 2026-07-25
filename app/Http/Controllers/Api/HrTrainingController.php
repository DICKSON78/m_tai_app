<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\TrainingProgram;
use App\Models\TrainingEnrollment;
use App\Models\Business;
use Illuminate\Http\Request;

class HrTrainingController extends Controller
{
    public function index(Request $request)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $programs = TrainingProgram::where('business_id', $businessId)
            ->withCount('enrollments')
            ->when($request->status, fn($q, $v) => $q->where('status', $v))
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 20);
        return response()->json($programs);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'instructor' => 'nullable|string',
            'duration_hours' => 'nullable|integer|min:1',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'max_participants' => 'nullable|integer|min:0',
            'cost' => 'nullable|numeric|min:0',
        ]);
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $validated['business_id'] = $businessId;
        $validated['status'] = 'planned';
        $program = TrainingProgram::create($validated);
        return response()->json($program, 201);
    }

    public function show(Request $request, TrainingProgram $trainingProgram)
    {
        return response()->json($trainingProgram->load('enrollments.employee:id,first_name,last_name,employee_number'));
    }

    public function update(Request $request, TrainingProgram $trainingProgram)
    {
        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'status' => 'sometimes|in:planned,active,completed,cancelled',
        ]);
        $trainingProgram->update($validated);
        return response()->json($trainingProgram);
    }

    public function enroll(Request $request, TrainingProgram $trainingProgram)
    {
        $validated = $request->validate(['employee_id' => 'required|exists:hr_employees,id']);
        $enrollment = TrainingEnrollment::create([
            'training_program_id' => $trainingProgram->id,
            'employee_id' => $validated['employee_id'],
            'status' => 'enrolled',
        ]);
        $trainingProgram->increment('applications_count');
        return response()->json($enrollment, 201);
    }

    public function destroy(Request $request, TrainingProgram $trainingProgram)
    {
        $trainingProgram->enrollments()->delete();
        $trainingProgram->delete();
        return response()->json(['message' => 'Training program deleted']);
    }
}
