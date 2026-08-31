<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Customer;
use App\Models\Loan;
use App\Models\LoanPayment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LoanController extends Controller
{
    public function index(Request $request, Business $business)
    {
        $this->authorizeBusiness($request, $business);

        $request->validate([
            'status' => 'nullable|string|in:active,paid,overdue,defaulted',
            'customer_id' => 'nullable|integer|exists:customers,id',
            'search' => 'nullable|string|max:255',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        $loans = $business->loans()
            ->with('customer:id,full_name,phone')
            ->when($request->status, fn ($q, $v) => $q->where('status', $v))
            ->when($request->customer_id, fn ($q, $v) => $q->where('customer_id', $v))
            ->when($request->search, function ($q, $v) {
                $q->whereHas('customer', function ($cq) use ($v) {
                    $cq->where('full_name', 'like', "%{$v}%")
                        ->orWhere('phone', 'like', "%{$v}%");
                });
            })
            ->withSum('payments', 'amount')
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 15);

        return response()->json($loans);
    }

    public function store(Request $request, Business $business)
    {
        $this->authorizeBusiness($request, $business);

        $validated = $request->validate([
            'customer_id' => 'required|integer|exists:customers,id',
            'loan_type' => 'required|in:go_pro_bank,go_premiere_friendly,mali_kauli,amana_cash,forgotten_change,other',
            'loan_amount' => 'required|numeric|min:0.01',
            'interest_rate' => 'sometimes|numeric|min:0|max:100',
            'repayment_plan' => 'nullable|string|max:1000',
            'repayment_months' => 'nullable|integer|min:1|max:120',
            'start_date' => 'required|date',
            'due_date' => 'nullable|date|after_or_equal:start_date',
            'notes' => 'nullable|string|max:1000',
        ]);

        $customer = Customer::findOrFail($validated['customer_id']);

        if ($customer->business_id !== $business->id) {
            return response()->json([
                'message' => 'Mteja huyu si wa biashara hii.',
            ], 422);
        }

        $schedule = null;
        $repaymentMonths = $validated['repayment_months'] ?? null;
        if ($repaymentMonths) {
            $schedule = $this->buildRepaymentSchedule(
                (float) $validated['loan_amount'],
                (float) ($validated['interest_rate'] ?? 0),
                $repaymentMonths,
                $validated['start_date']
            );
        }

        $loan = Loan::create([
            'business_id' => $business->id,
            'customer_id' => $validated['customer_id'],
            'loan_type' => $validated['loan_type'],
            'loan_amount' => $validated['loan_amount'],
            'loan_balance' => $validated['loan_amount'],
            'interest_rate' => $validated['interest_rate'] ?? 0,
            'repayment_plan' => $validated['repayment_plan'] ?? null,
            'repayment_months' => $repaymentMonths,
            'repayment_schedule' => $schedule,
            'status' => 'active',
            'start_date' => $validated['start_date'],
            'due_date' => $validated['due_date'] ?? ($schedule ? last($schedule)['due_date'] : null),
            'notes' => $validated['notes'] ?? null,
        ]);

        $loan->load('customer:id,full_name,phone');

        return response()->json([
            'message' => 'Hisa limeundwa kwa mafanikio.',
            'loan' => $loan,
        ], 201);
    }

    protected function buildRepaymentSchedule($principal, $annualRate, $months, $startDate)
    {
        $installments = array_fill(0, $months, 0);
        $interestTotal = $months > 0 ? round($principal * ($annualRate / 100) * ($months / 12), 2) : 0;
        $totalRepayable = $principal + $interestTotal;
        $baseInstallment = round($totalRepayable / $months, 2);

        $start = \Carbon\Carbon::parse($startDate);
        $schedule = [];
        for ($i = 0; $i < $months; $i++) {
            $due = $start->copy()->addMonths($i + 1)->toDateString();
            $schedule[] = [
                'installment' => $i + 1,
                'due_date' => $due,
                'principal' => round($principal / $months, 2),
                'interest' => round($interestTotal / $months, 2),
                'amount' => $baseInstallment,
                'status' => 'pending',
            ];
        }

        return $schedule;
    }

    public function schedule(Request $request, Business $business, Loan $loan)
    {
        $this->authorizeBusiness($request, $business);

        if ($loan->business_id !== $business->id) {
            abort(403, 'Huna ruhusa kuona hisa hili.');
        }

        $totalPaid = $loan->totalPaid();
        $schedule = collect($loan->repayment_schedule ?? [])->map(function ($row) {
            return $row;
        })->toArray();

        return response()->json([
            'loan' => [
                'id' => $loan->id,
                'loan_amount' => (float) $loan->loan_amount,
                'interest_rate' => (float) $loan->interest_rate,
                'repayment_months' => $loan->repayment_months,
            ],
            'total_paid' => $totalPaid,
            'loan_balance' => (float) $loan->loan_balance,
            'schedule' => $schedule,
        ]);
    }

    public function approve(Request $request, Business $business, Loan $loan)
    {
        $this->authorizeBusiness($request, $business);

        if ($loan->business_id !== $business->id) {
            abort(403, 'Huna ruhusa kuibadilisha hisa hili.');
        }

        if ($loan->approved_at) {
            return response()->json(['message' => 'Hisa hili tayari limeidhinishwa.'], 422);
        }

        $loan->update(['approved_at' => now(), 'status' => 'active']);

        return response()->json([
            'message' => 'Hisa limeidhinishwa.',
            'loan' => $loan->fresh()->load('customer:id,full_name,phone'),
        ]);
    }

    public function show(Request $request, Business $business, Loan $loan)
    {
        $this->authorizeBusiness($request, $business);

        if ($loan->business_id !== $business->id) {
            abort(403, 'Huna ruhusa ya kuona hisa hili.');
        }

        $loan->load('customer:id,full_name,phone,location');
        $loan->load('payments.recordedBy:id,name');

        $totalPaid = $loan->totalPaid();

        return response()->json([
            'loan' => $loan,
            'stats' => [
                'total_paid' => $totalPaid,
                'loan_balance' => (float) $loan->loan_balance,
                'remaining' => max(0, (float) $loan->loan_amount - $totalPaid),
                'is_fully_paid' => $totalPaid >= (float) $loan->loan_amount,
            ],
        ]);
    }

    public function update(Request $request, Business $business, Loan $loan)
    {
        $this->authorizeBusiness($request, $business);

        if ($loan->business_id !== $business->id) {
            abort(403, 'Huna ruhusa ya kubadilisha hisa hili.');
        }

        $validated = $request->validate([
            'notes' => 'nullable|string|max:1000',
            'due_date' => 'nullable|date',
            'status' => 'sometimes|in:active,paid,overdue,defaulted',
            'repayment_plan' => 'nullable|string|max:1000',
        ]);

        $loan->update($validated);

        return response()->json([
            'message' => 'Hisa limenasishwa.',
            'loan' => $loan->fresh()->load('customer:id,full_name,phone'),
        ]);
    }

    public function pay(Request $request, Business $business, Loan $loan)
    {
        $this->authorizeBusiness($request, $business);

        if ($loan->business_id !== $business->id) {
            abort(403, 'Huna ruhusa kufanya malipo kwenye hisa hili.');
        }

        if ($loan->status === 'paid') {
            return response()->json([
                'message' => 'Hisa hili tayari limezidi kulipia.',
            ], 422);
        }

        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string|max:500',
        ]);

        $totalPaid = $loan->totalPaid();

        $schedule = $loan->repayment_schedule ?? [];
        $interestTotal = $schedule ? (float) collect($schedule)->sum('interest') : 0;
        $totalRepayable = (float) $loan->loan_amount + $interestTotal;
        $remaining = max(0, $totalRepayable - $totalPaid);

        if ($validated['amount'] > $remaining) {
            return response()->json([
                'message' => 'Kiasi kilichowekwa ni kikubwa kuliko deni lililobaki. Deni lililobaki ni ' . number_format($remaining, 2),
                'remaining' => $remaining,
            ], 422);
        }

        DB::beginTransaction();

        try {
            $payment = LoanPayment::create([
                'loan_id' => $loan->id,
                'business_id' => $business->id,
                'amount' => $validated['amount'],
                'notes' => $validated['notes'] ?? null,
                'recorded_by' => $request->user()->id,
            ]);

            $newOutstanding = max(0, $totalRepayable - ($totalPaid + $validated['amount']));
            $newBalance = max(0, $newOutstanding - $interestTotal);
            $loan->update(['loan_balance' => $newBalance]);

            $newTotalPaid = $totalPaid + $validated['amount'];
            if ($newTotalPaid >= $totalRepayable) {
                $loan->update(['status' => 'paid']);
            }

            DB::commit();

            $loan->load('customer:id,full_name,phone');

            return response()->json([
                'message' => $loan->status === 'paid'
                    ? 'Malipo yamekamilika. Hisa limezidi kulipia.'
                    : 'Malipo yamerekodwa kwa mafanikio.',
                'payment' => $payment->load('recordedBy:id,name'),
                'loan' => $loan,
                'stats' => [
                    'total_paid' => $newTotalPaid,
                    'loan_balance' => (float) $loan->loan_balance,
                    'remaining' => max(0, $totalRepayable - $newTotalPaid),
                    'is_fully_paid' => $newTotalPaid >= $totalRepayable,
                ],
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Hitilafu wakati wa kurekodi malipo. Tafadhali jaribu tena.',
            ], 500);
        }
    }

    public function summary(Request $request, Business $business)
    {
        $this->authorizeBusiness($request, $business);

        $loans = $business->loans();

        $totalLent = (clone $loans)->sum('loan_amount');
        $totalRepaid = LoanPayment::where('business_id', $business->id)->sum('amount');
        $outstanding = (clone $loans)->where('status', '!=', 'paid')->sum('loan_balance');

        $countsByStatus = (clone $loans)
            ->select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        return response()->json([
            'total_lent' => (float) $totalLent,
            'total_repaid' => (float) $totalRepaid,
            'outstanding' => (float) $outstanding,
            'counts_by_status' => [
                'active' => $countsByStatus['active'] ?? 0,
                'paid' => $countsByStatus['paid'] ?? 0,
                'overdue' => $countsByStatus['overdue'] ?? 0,
                'defaulted' => $countsByStatus['defaulted'] ?? 0,
            ],
        ]);
    }

    public function calculator(Request $request, Business $business)
    {
        $this->authorizeBusiness($request, $business);

        $validated = $request->validate([
            'required_capital' => 'required|numeric|min:0',
            'timeline_months' => 'required|integer|min:1',
            'available_capital' => 'nullable|numeric|min:0',
            'interest_rate' => 'nullable|numeric|min:0|max:100',
            'monthly_savings_capacity' => 'nullable|numeric|min:0',
        ]);

        $requiredCapital = (float) $validated['required_capital'];
        $timeline = (int) $validated['timeline_months'];
        $available = (float) ($validated['available_capital'] ?? 0);
        $interestRate = (float) ($validated['interest_rate'] ?? 0);

        $gap = max(0, $requiredCapital - $available);

        $savingsPerMonth = $timeline > 0 ? $gap / $timeline : 0;

        $savingsCapacity = isset($validated['monthly_savings_capacity'])
            ? (float) $validated['monthly_savings_capacity']
            : max($savingsPerMonth, round($gap > 0 ? $gap * 0.05 : 0, 2));

        $affordableLoan = $timeline * $savingsCapacity;
        $loanWithInterest = $interestRate > 0
            ? $affordableLoan * (1 + $interestRate / 100)
            : $affordableLoan;

        $recommendedLoan = round(min($gap, $loanWithInterest), 2);

        return response()->json([
            'calculator' => [
                'required_capital' => round($requiredCapital, 2),
                'total_available_capital' => round($available, 2),
                'capital_gap' => round($gap, 2),
                'timeline_months' => $timeline,
                'savings_plan' => [
                    'monthly_savings_needed' => round($savingsPerMonth, 2),
                    'monthly_savings_capacity' => round($savingsCapacity, 2),
                    'expected_total_savings' => round($savingsCapacity * $timeline, 2),
                ],
                'recommended_loan_amount' => $recommendedLoan,
                'interest_rate' => $interestRate,
                'estimated_total_repayable' => round($recommendedLoan * (1 + $interestRate / 100), 2),
            ],
        ]);
    }

    protected function authorizeBusiness(Request $request, Business $business)
    {
        if ($business->user_id !== $request->user()->id) {
            abort(403, 'Huna ruhusa ya kufanya operesheni hii.');
        }
    }
}
