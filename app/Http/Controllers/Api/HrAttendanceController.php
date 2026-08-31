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

    private function resolveEmployee(Request $request)
    {
        return HrEmployee::where('user_id', $request->user()->id)->first();
    }

    public function employeeIndex(Request $request)
    {
        $employee = $this->resolveEmployee($request);
        if (! $employee) {
            return response()->json(['data' => [], 'today' => null]);
        }

        $records = Attendance::where('employee_id', $employee->id)
            ->orderBy('date', 'desc')
            ->paginate($request->per_page ?? 30);

        $today = Attendance::where('employee_id', $employee->id)
            ->where('date', now()->toDateString())
            ->first();

        return response()->json([
            'data' => $records,
            'today' => $today,
        ]);
    }

    public function employeeStore(Request $request)
    {
        $employee = $this->resolveEmployee($request);
        if (! $employee) {
            return response()->json(['message' => 'Profaili ya mfanyakazi haijapatikana.'], 404);
        }

        $validated = $request->validate([
            'action' => 'required|in:clock_in,clock_out',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'location' => 'nullable|string|max:255',
        ]);

        $today = now()->toDateString();
        $record = Attendance::firstOrNew(['employee_id' => $employee->id, 'date' => $today]);

        if ($validated['action'] === 'clock_in') {
            if ($record->exists && $record->clock_in) {
                return response()->json(['message' => 'Umeshaingia leo.'], 422);
            }
            $record->clock_in = now()->format('H:i:s');
            $record->status = now()->hour >= 9 ? 'late' : 'present';
            $record->latitude = $request->input('latitude');
            $record->longitude = $request->input('longitude');
            $record->location = $request->input('location');
            $record->save();
        } else {
            if (! $record->exists || ! $record->clock_in) {
                return response()->json(['message' => 'Hujaja kuingia.'], 422);
            }
            $record->clock_out = now()->format('H:i:s');
            if ($request->filled('latitude')) $record->latitude = $request->input('latitude');
            if ($request->filled('longitude')) $record->longitude = $request->input('longitude');
            if ($request->filled('location')) $record->location = $request->input('location');
            $in = \Carbon\Carbon::parse($record->clock_in);
            $out = \Carbon\Carbon::parse($record->clock_out);
            $record->hours_worked = round($in->diffInMinutes($out) / 60, 2);
            $record->save();
        }

        return response()->json(['record' => $record]);
    }
}
