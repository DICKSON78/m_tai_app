<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Payroll;
use App\Models\PayrollItem;
use App\Models\HrEmployee;
use App\Models\Business;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class HrPayrollController extends Controller
{
    public function index(Request $request)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $payrolls = Payroll::where('business_id', $businessId)
            ->when($request->status, fn($q, $v) => $q->where('status', $v))
            ->orderBy('period_start', 'desc')
            ->paginate($request->per_page ?? 20);
        return response()->json($payrolls);
    }

    public function show(Request $request, Payroll $payroll)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($payroll->business_id !== $businessId) abort(403);
        return response()->json($payroll->load('items.employee:id,first_name,last_name,employee_number'));
    }

    public function generate(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'period_start' => 'required|date',
            'period_end' => 'required|date|after_or_equal:period_start',
            'payment_date' => 'required|date',
        ]);
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $employees = HrEmployee::where('business_id', $businessId)->where('status', 'active')->get();

        $payroll = DB::transaction(function () use ($validated, $businessId, $employees) {
            $totalGross = 0;
            $totalDeductions = 0;

            $payroll = Payroll::create([
                'business_id' => $businessId,
                'name' => $validated['name'],
                'period_start' => $validated['period_start'],
                'period_end' => $validated['period_end'],
                'payment_date' => $validated['payment_date'],
                'status' => 'draft',
                'processed_by' => request()->user()->id,
            ]);

            foreach ($employees as $emp) {
                $netPay = $emp->base_salary;
                PayrollItem::create([
                    'payroll_id' => $payroll->id,
                    'employee_id' => $emp->id,
                    'base_salary' => $emp->base_salary,
                    'allowances' => 0,
                    'bonuses' => 0,
                    'tax_deduction' => 0,
                    'other_deductions' => 0,
                    'net_pay' => $netPay,
                    'status' => 'pending',
                ]);
                $totalGross += $emp->base_salary;
            }

            $payroll->update(['total_gross' => $totalGross, 'total_deductions' => $totalDeductions, 'total_net' => $totalGross - $totalDeductions]);
            return $payroll;
        });

        return response()->json($payroll->load('items.employee'), 201);
    }

    public function process(Request $request, Payroll $payroll)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($payroll->business_id !== $businessId) abort(403);
        $payroll->update(['status' => 'processed']);
        return response()->json($payroll);
    }

    public function pay(Request $request, Payroll $payroll)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($payroll->business_id !== $businessId) abort(403);
        $payroll->items()->update(['status' => 'paid']);
        $payroll->update(['status' => 'paid']);
        return response()->json($payroll);
    }

    public function updateItem(Request $request, PayrollItem $item)
    {
        $validated = $request->validate([
            'allowances' => 'sometimes|numeric|min:0',
            'bonuses' => 'sometimes|numeric|min:0',
            'overtime_hours' => 'sometimes|numeric|min:0',
            'overtime_rate' => 'sometimes|numeric|min:0',
            'tax_deduction' => 'sometimes|numeric|min:0',
            'other_deductions' => 'sometimes|numeric|min:0',
        ]);
        $item->update($validated);
        $item->net_pay = $item->base_salary + $item->allowances + $item->bonuses + ($item->overtime_hours * $item->overtime_rate) - $item->tax_deduction - $item->other_deductions;
        $item->save();
        return response()->json($item);
    }

    public function destroy(Request $request, Payroll $payroll)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($payroll->business_id !== $businessId) abort(403);
        $payroll->items()->delete();
        $payroll->delete();
        return response()->json(['message' => 'Payroll deleted']);
    }
}
