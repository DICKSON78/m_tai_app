<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\LeaveType;
use App\Models\LeaveRequest;
use App\Models\Business;
use Illuminate\Http\Request;

class HrLeaveController extends Controller
{
    public function types(Request $request)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        return response()->json(LeaveType::where('business_id', $businessId)->where('is_active', true)->get());
    }

    public function storeType(Request $request)
    {
        $validated = $request->validate(['name' => 'required|string', 'days_per_year' => 'required|integer|min:1', 'is_paid' => 'sometimes|boolean']);
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $validated['business_id'] = $businessId;
        $validated['is_active'] = true;
        return response()->json(LeaveType::create($validated), 201);
    }

    public function updateType(Request $request, LeaveType $leaveType)
    {
        $validated = $request->validate(['name' => 'sometimes|string', 'days_per_year' => 'sometimes|integer|min:1', 'is_paid' => 'sometimes|boolean']);
        $leaveType->update($validated);
        return response()->json($leaveType);
    }

    public function destroyType(Request $request, LeaveType $leaveType)
    {
        $leaveType->delete();
        return response()->json(['message' => 'Leave type deleted']);
    }

    public function requests(Request $request)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $query = LeaveRequest::whereHas('employee', fn($q) => $q->where('business_id', $businessId))
            ->with('employee:id,first_name,last_name,employee_number', 'leaveType:id,name')
            ->when($request->status, fn($q, $v) => $q->where('status', $v))
            ->when($request->employee_id, fn($q, $v) => $q->where('employee_id', $v))
            ->orderBy('created_at', 'desc');
        return response()->json($query->paginate($request->per_page ?? 20));
    }

    public function storeRequest(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:hr_employees,id',
            'leave_type_id' => 'required|exists:leave_types,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'nullable|string',
        ]);
        $start = \Carbon\Carbon::parse($validated['start_date']);
        $end = \Carbon\Carbon::parse($validated['end_date']);
        $validated['days'] = $start->diffInDays($end) + 1;
        $validated['status'] = 'pending';
        $leave = LeaveRequest::create($validated);
        return response()->json($leave->load('leaveType'), 201);
    }

    public function approve(Request $request, LeaveRequest $leaveRequest)
    {
        $leaveRequest->update(['status' => 'approved', 'approved_by' => $request->user()->id, 'approved_at' => now()]);
        return response()->json($leaveRequest);
    }

    public function reject(Request $request, LeaveRequest $leaveRequest)
    {
        $validated = $request->validate(['rejection_reason' => 'nullable|string']);
        $leaveRequest->update(array_merge(['status' => 'rejected'], $validated));
        return response()->json($leaveRequest);
    }

    public function destroy(Request $request, LeaveRequest $leaveRequest)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($leaveRequest->employee->business_id !== $businessId) abort(403);
        $leaveRequest->delete();
        return response()->json(['message' => 'Leave request deleted']);
    }
}
