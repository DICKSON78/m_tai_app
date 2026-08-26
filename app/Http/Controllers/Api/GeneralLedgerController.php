<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\JournalEntryLine;
use Illuminate\Http\Request;

class GeneralLedgerController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'account_id' => 'nullable|integer|exists:accounts,id',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
            'search' => 'nullable|string|max:255',
            'per_page' => 'nullable|integer|min:1|max:100',
        ], [
            'account_id.exists' => 'Akaunti hiyo haipatikani.',
            'date_from.date' => 'Tarehe ya kuanza si sahihi.',
            'date_to.date' => 'Tarehe ya mwisho si sahihi.',
            'date_to.after_or_equal' => 'Tarehe ya mwisho lazima iwe sawa au baada ya tarehe ya kuanza.',
            'per_page.max' => 'Idadi ya kurasa kwa ukurasa haizidi 100.',
        ]);

        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;

        $query = JournalEntryLine::whereHas('journalEntry', function ($q) use ($businessId) {
            $q->where('business_id', $businessId)->where('is_posted', true);
        })
        ->with(['account:id,code,name,type', 'journalEntry:id,date,reference,description,journal_type', 'costCenter:id,name,code'])
        ->when($request->account_id, fn($q, $v) => $q->where('account_id', $v))
        ->when($request->date_from, fn($q, $v) => $q->whereHas('journalEntry', fn($q2) => $q2->where('date', '>=', $v)))
        ->when($request->date_to, fn($q, $v) => $q->whereHas('journalEntry', fn($q2) => $q2->where('date', '<=', $v)))
        ->when($request->search, function ($q, $v) {
            $q->whereHas('journalEntry', fn($q2) => $q2->where('description', 'like', "%{$v}%")->orWhere('reference', 'like', "%{$v}%"));
        })
        ->orderBy('id', 'desc')
        ->paginate($request->per_page ?? 50);

        return response()->json($query);
    }

    public function accountLedger(Request $request, Account $account)
    {
        $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
        ], [
            'date_from.date' => 'Tarehe ya kuanza si sahihi.',
            'date_to.date' => 'Tarehe ya mwisho si sahihi.',
            'date_to.after_or_equal' => 'Tarehe ya mwisho lazima iwe sawa au baada ya tarehe ya kuanza.',
        ]);

        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($account->business_id !== $businessId) abort(403);

        $lines = JournalEntryLine::where('account_id', $account->id)
            ->whereHas('journalEntry', function ($q) use ($businessId) {
                $q->where('business_id', $businessId)->where('is_posted', true);
            })
            ->with(['journalEntry:id,date,reference,description,journal_type', 'costCenter:id,name,code'])
            ->when($request->date_from, fn($q, $v) => $q->whereHas('journalEntry', fn($q2) => $q2->where('date', '>=', $v)))
            ->when($request->date_to, fn($q, $v) => $q->whereHas('journalEntry', fn($q2) => $q2->where('date', '<=', $v)))
            ->orderBy('id')
            ->get();

        $runningBalance = $account->opening_balance;
        $ledger = $lines->map(function ($line) use (&$runningBalance) {
            $runningBalance += $line->debit - $line->credit;
            return [
                'id' => $line->id,
                'date' => $line->journalEntry->date,
                'reference' => $line->journalEntry->reference,
                'description' => $line->description ?? $line->journalEntry->description,
                'journal_type' => $line->journalEntry->journal_type,
                'debit' => $line->debit,
                'credit' => $line->credit,
                'balance' => $runningBalance,
                'cost_center' => $line->costCenter?->name,
            ];
        });

        return response()->json([
            'account' => [
                'id' => $account->id,
                'code' => $account->code,
                'name' => $account->name,
                'type' => $account->type,
                'opening_balance' => $account->opening_balance,
            ],
            'opening_balance' => $account->opening_balance,
            'closing_balance' => $runningBalance,
            'total_debit' => $lines->sum('debit'),
            'total_credit' => $lines->sum('credit'),
            'transactions' => $ledger,
        ]);
    }

    public function summary(Request $request)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;

        $accounts = Account::where('business_id', $businessId)->where('is_active', true)
            ->withSum(['journalEntryLines' => fn($q) => $q->whereHas('journalEntry', fn($q2) => $q2->where('is_posted', true))], 'debit')
            ->withSum(['journalEntryLines' => fn($q) => $q->whereHas('journalEntry', fn($q2) => $q2->where('is_posted', true))], 'credit')
            ->orderBy('code')
            ->get()
            ->map(fn($a) => [
                'id' => $a->id, 'code' => $a->code, 'name' => $a->name, 'type' => $a->type,
                'balance' => $a->opening_balance + ($a->journal_entry_lines_sum_debit ?? 0) - ($a->journal_entry_lines_sum_credit ?? 0),
                'debit' => $a->journal_entry_lines_sum_debit ?? 0,
                'credit' => $a->journal_entry_lines_sum_credit ?? 0,
            ])
            ->groupBy('type');

        return response()->json([
            'assets' => $accounts->get('asset', collect()),
            'liabilities' => $accounts->get('liability', collect()),
            'equity' => $accounts->get('equity', collect()),
            'revenue' => $accounts->get('revenue', collect()),
            'expenses' => $accounts->get('expense', collect()),
            'total_assets' => $accounts->get('asset', collect())->sum('balance'),
            'total_liabilities' => $accounts->get('liability', collect())->sum('balance'),
            'total_equity' => $accounts->get('equity', collect())->sum('balance'),
            'total_revenue' => $accounts->get('revenue', collect())->sum('balance'),
            'total_expenses' => $accounts->get('expense', collect())->sum('balance'),
        ]);
    }
}
