<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\HrEmployee;
use Illuminate\Http\Request;

class HrAttendanceController extends Controller
{
    public function index(Request $request)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $query = Attendance::whereHas('employee', fn($q) => $q->where('business_id', $businessId))
            ->with('employee:id,first_name,last_name,employee_number')
            ->when($request->employee_id, fn($q, $v) => $q->where('employee_id', $v))
            ->when($request->date_from, fn($q, $v) => $q->where('date', '>=', $v))
            ->when($request->date_to, fn($q, $v) => $q->where('date', '<=', $v))
            ->when($request->status, fn($q, $v) => $q->where('status', $v))
            ->orderBy('date', 'desc');
        return response()->json($query->paginate($request->per_page ?? 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:hr_employees,id',
            'date' => 'required|date',
            'clock_in' => 'nullable',
            'clock_out' => 'nullable',
            'hours_worked' => 'nullable|numeric|min:0',
            'status' => 'required|in:present,absent,late,half_day,on_leave',
            'notes' => 'nullable|string',
        ]);
        $attendance = Attendance::create($validated);
        return response()->json($attendance, 201);
    }

    public function clockIn(Request $request)
    {
        $validated = $request->validate(['employee_id' => 'required|exists:hr_employees,id']);
        $today = now()->toDateString();
        $existing = Attendance::where('employee_id', $validated['employee_id'])->where('date', $today)->first();
        if ($existing) return response()->json(['message' => 'Already clocked in today'], 422);
        $attendance = Attendance::create([
            'employee_id' => $validated['employee_id'],
            'date' => $today,
            'clock_in' => now()->format('H:i:s'),
            'status' => now()->hour >= 9 ? 'late' : 'present',
        ]);
        return response()->json($attendance, 201);
    }

    public function clockOut(Request $request, Attendance $attendance)
    {
        $attendance->clock_out = now()->format('H:i:s');
        if ($attendance->clock_in) {
            $in = \Carbon\Carbon::parse($attendance->clock_in);
            $out = \Carbon\Carbon::parse($attendance->clock_out);
            $attendance->hours_worked = round($in->diffInMinutes($out) / 60, 2);
        }
        $attendance->save();
        return response()->json($attendance);
    }

    public function destroy(Request $request, Attendance $attendance)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($attendance->employee->business_id !== $businessId) abort(403);
        $attendance->delete();
        return response()->json(['message' => 'Attendance record deleted']);
    }
}
