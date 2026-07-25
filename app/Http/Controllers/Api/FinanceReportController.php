<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Invoice;
use App\Models\Bill;
use App\Models\Budget;
use App\Models\SupplierInvoice;
use App\Models\SupplierPayment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FinanceReportController extends Controller
{
    public function profitLoss(Request $request)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $dateFrom = $request->date_from ?? now()->startOfYear()->toDateString();
        $dateTo = $request->date_to ?? now()->toDateString();

        $revenues = Account::where('business_id', $businessId)->where('type', 'revenue')
            ->withSum(['journalEntryLines' => fn($q) => $q->whereHas('journalEntry', fn($q2) => $q2->whereBetween('date', [$dateFrom, $dateTo])->where('is_posted', true))], 'credit')
            ->withSum(['journalEntryLines' => fn($q) => $q->whereHas('journalEntry', fn($q2) => $q2->whereBetween('date', [$dateFrom, $dateTo])->where('is_posted', true))], 'debit')
            ->get()
            ->map(fn($a) => ['id' => $a->id, 'code' => $a->code, 'name' => $a->name, 'amount' => ($a->journal_entry_lines_sum_credit ?? 0) - ($a->journal_entry_lines_sum_debit ?? 0)]);

        $expenses = Account::where('business_id', $businessId)->where('type', 'expense')
            ->withSum(['journalEntryLines' => fn($q) => $q->whereHas('journalEntry', fn($q2) => $q2->whereBetween('date', [$dateFrom, $dateTo])->where('is_posted', true))], 'debit')
            ->withSum(['journalEntryLines' => fn($q) => $q->whereHas('journalEntry', fn($q2) => $q2->whereBetween('date', [$dateFrom, $dateTo])->where('is_posted', true))], 'credit')
            ->get()
            ->map(fn($a) => ['id' => $a->id, 'code' => $a->code, 'name' => $a->name, 'amount' => ($a->journal_entry_lines_sum_debit ?? 0) - ($a->journal_entry_lines_sum_credit ?? 0)]);

        $totalRevenue = $revenues->sum('amount');
        $totalExpenses = $expenses->sum('amount');

        return response()->json([
            'period' => ['from' => $dateFrom, 'to' => $dateTo],
            'revenues' => $revenues,
            'expenses' => $expenses,
            'total_revenue' => $totalRevenue,
            'total_expenses' => $totalExpenses,
            'net_income' => $totalRevenue - $totalExpenses,
        ]);
    }

    public function balanceSheet(Request $request)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;

        $getBalance = function ($type) use ($businessId) {
            return Account::where('business_id', $businessId)->where('type', $type)
                ->withSum(['journalEntryLines' => fn($q) => $q->whereHas('journalEntry', fn($q2) => $q2->where('is_posted', true))], 'debit')
                ->withSum(['journalEntryLines' => fn($q) => $q->whereHas('journalEntry', fn($q2) => $q2->where('is_posted', true))], 'credit')
                ->get()
                ->map(fn($a) => [
                    'id' => $a->id, 'code' => $a->code, 'name' => $a->name,
                    'balance' => $a->opening_balance + ($a->journal_entry_lines_sum_debit ?? 0) - ($a->journal_entry_lines_sum_credit ?? 0)
                ]);
        };

        $assets = $getBalance('asset');
        $liabilities = $getBalance('liability');
        $equity = $getBalance('equity');

        $totalAssets = $assets->sum('balance');
        $totalLiabilities = $liabilities->sum('balance');
        $totalEquity = $equity->sum('balance');

        return response()->json([
            'assets' => ['items' => $assets, 'total' => $totalAssets],
            'liabilities' => ['items' => $liabilities, 'total' => $totalLiabilities],
            'equity' => ['items' => $equity, 'total' => $totalEquity],
            'total_liabilities_and_equity' => $totalLiabilities + $totalEquity,
            'is_balanced' => abs($totalAssets - ($totalLiabilities + $totalEquity)) < 0.01,
        ]);
    }

    public function cashFlow(Request $request)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $dateFrom = $request->date_from ?? now()->startOfMonth()->toDateString();
        $dateTo = $request->date_to ?? now()->toDateString();

        $cashIn = Invoice::where('business_id', $businessId)->whereBetween('date', [$dateFrom, $dateTo])->sum('amount_paid');
        $cashOut = Bill::where('business_id', $businessId)->whereBetween('date', [$dateFrom, $dateTo])->sum('amount_paid');
        $supplierPayments = SupplierPayment::where('business_id', $businessId)->where('status', 'confirmed')
            ->whereBetween('payment_date', [$dateFrom, $dateTo])->sum('local_amount');

        return response()->json([
            'period' => ['from' => $dateFrom, 'to' => $dateTo],
            'cash_in' => $cashIn,
            'cash_out' => $cashOut + $supplierPayments,
            'net_cash_flow' => $cashIn - $cashOut - $supplierPayments,
            'breakdown' => [
                'customer_payments' => $cashIn,
                'bills_paid' => $cashOut,
                'supplier_payments' => $supplierPayments,
            ],
        ]);
    }

    public function trialBalance(Request $request)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $accounts = Account::where('business_id', $businessId)
            ->withSum(['journalEntryLines' => fn($q) => $q->whereHas('journalEntry', fn($q2) => $q2->where('is_posted', true))], 'debit')
            ->withSum(['journalEntryLines' => fn($q) => $q->whereHas('journalEntry', fn($q2) => $q2->where('is_posted', true))], 'credit')
            ->orderBy('code')
            ->get()
            ->map(fn($a) => [
                'id' => $a->id, 'code' => $a->code, 'name' => $a->name, 'type' => $a->type,
                'total_debit' => ($a->journal_entry_lines_sum_debit ?? 0) + $a->opening_balance,
                'total_credit' => $a->journal_entry_lines_sum_credit ?? 0,
            ])
            ->filter(fn($a) => $a['total_debit'] > 0 || $a['total_credit'] > 0);

        return response()->json([
            'accounts' => $accounts->values(),
            'total_debit' => $accounts->sum('total_debit'),
            'total_credit' => $accounts->sum('total_credit'),
            'is_balanced' => abs($accounts->sum('total_debit') - $accounts->sum('total_credit')) < 0.01,
        ]);
    }

    public function agedReceivables(Request $request)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $invoices = Invoice::where('business_id', $businessId)
            ->whereNotIn('status', ['paid', 'cancelled'])
            ->with('customer:id,name,phone')
            ->get();

        $today = now();
        $aging = ['current' => [], '1_30' => [], '31_60' => [], '61_90' => [], 'over_90' => []];
        $totals = ['current' => 0, '1_30' => 0, '31_60' => 0, '61_90' => 0, 'over_90' => 0];

        foreach ($invoices as $inv) {
            $balance = $inv->total - $inv->amount_paid;
            $days = $inv->due_date->diffInDays($today, false);

            $item = [
                'id' => $inv->id, 'invoice_number' => $inv->invoice_number,
                'customer' => $inv->customer?->name ?? 'Unknown',
                'date' => $inv->date, 'due_date' => $inv->due_date,
                'total' => $inv->total, 'amount_paid' => $inv->amount_paid,
                'balance' => $balance, 'days_overdue' => max($days, 0),
            ];

            if ($days <= 0) { $aging['current'][] = $item; $totals['current'] += $balance; }
            elseif ($days <= 30) { $aging['1_30'][] = $item; $totals['1_30'] += $balance; }
            elseif ($days <= 60) { $aging['31_60'][] = $item; $totals['31_60'] += $balance; }
            elseif ($days <= 90) { $aging['61_90'][] = $item; $totals['61_90'] += $balance; }
            else { $aging['over_90'][] = $item; $totals['over_90'] += $balance; }
        }

        return response()->json([
            'aging' => $aging, 'totals' => $totals,
            'total_outstanding' => array_sum($totals), 'count' => $invoices->count(),
        ]);
    }

    public function agedPayables(Request $request)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $invoices = SupplierInvoice::where('business_id', $businessId)
            ->whereNotIn('status', ['paid', 'cancelled'])
            ->with('supplier:id,name,phone')
            ->get();

        $today = now();
        $aging = ['current' => [], '1_30' => [], '31_60' => [], '61_90' => [], 'over_90' => []];
        $totals = ['current' => 0, '1_30' => 0, '31_60' => 0, '61_90' => 0, 'over_90' => 0];

        foreach ($invoices as $inv) {
            $balance = $inv->total - $inv->amount_paid;
            $days = $inv->due_date->diffInDays($today, false);

            $item = [
                'id' => $inv->id, 'invoice_number' => $inv->invoice_number,
                'supplier' => $inv->supplier?->name ?? 'Unknown',
                'date' => $inv->invoice_date, 'due_date' => $inv->due_date,
                'total' => $inv->total, 'amount_paid' => $inv->amount_paid,
                'balance' => $balance, 'days_overdue' => max($days, 0),
            ];

            if ($days <= 0) { $aging['current'][] = $item; $totals['current'] += $balance; }
            elseif ($days <= 30) { $aging['1_30'][] = $item; $totals['1_30'] += $balance; }
            elseif ($days <= 60) { $aging['31_60'][] = $item; $totals['31_60'] += $balance; }
            elseif ($days <= 90) { $aging['61_90'][] = $item; $totals['61_90'] += $balance; }
            else { $aging['over_90'][] = $item; $totals['over_90'] += $balance; }
        }

        return response()->json([
            'aging' => $aging, 'totals' => $totals,
            'total_outstanding' => array_sum($totals), 'count' => $invoices->count(),
        ]);
    }

    public function budgetVsActual(Request $request)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $dateFrom = $request->date_from ?? now()->startOfYear()->toDateString();
        $dateTo = $request->date_to ?? now()->toDateString();

        $budgets = Budget::where('business_id', $businessId)
            ->where('start_date', '<=', $dateTo)
            ->where('end_date', '>=', $dateFrom)
            ->get();

        $result = $budgets->map(function ($budget) use ($dateFrom, $dateTo) {
            $account = Account::find($budget->account_id);
            $actualDebit = $account ? $account->journalEntryLines()
                ->whereHas('journalEntry', fn($q) => $q->whereBetween('date', [$dateFrom, $dateTo])->where('is_posted', true))
                ->sum('debit') : 0;
            $actualCredit = $account ? $account->journalEntryLines()
                ->whereHas('journalEntry', fn($q) => $q->whereBetween('date', [$dateFrom, $dateTo])->where('is_posted', true))
                ->sum('credit') : 0;

            $actual = in_array($account?->type, ['revenue']) ? $actualCredit - $actualDebit : $actualDebit - $actualCredit;

            return [
                'budget_id' => $budget->id,
                'account' => $account ? $account->code . ' - ' . $account->name : 'Unknown',
                'budget_amount' => $budget->amount,
                'actual_amount' => $actual,
                'variance' => $budget->amount - $actual,
                'variance_percent' => $budget->amount > 0 ? round((($budget->amount - $actual) / $budget->amount) * 100, 1) : 0,
            ];
        });

        return response()->json([
            'period' => ['from' => $dateFrom, 'to' => $dateTo],
            'items' => $result,
            'total_budget' => $result->sum('budget_amount'),
            'total_actual' => $result->sum('actual_amount'),
            'total_variance' => $result->sum('variance'),
        ]);
    }
}
