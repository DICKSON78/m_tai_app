<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BankAccount;
use App\Models\BankReconciliation;
use App\Models\BankTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BankReconciliationController extends Controller
{
    public function index(Request $request)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $reconciliations = BankReconciliation::where('business_id', $businessId)
            ->with(['bankAccount:id,name,account_number'])
            ->when($request->bank_account_id, fn ($q, $v) => $q->where('bank_account_id', $v))
            ->when($request->status, fn ($q, $v) => $q->where('status', $v))
            ->orderBy($request->sort ?? 'created_at', $request->order ?? 'desc')
            ->paginate($request->per_page ?? 20);

        return response()->json($reconciliations);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'bank_account_id' => 'required|exists:bank_accounts,id',
            'reconciliation_date' => 'required|date',
            'statement_balance' => 'required|numeric',
            'notes' => 'nullable|string',
        ]);

        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $bankAccount = BankAccount::findOrFail($validated['bank_account_id']);
        if ($bankAccount->business_id !== $businessId) abort(403);

        $bookBalance = $bankAccount->current_balance;

        $reconciliation = BankReconciliation::create([
            'business_id' => $businessId,
            'bank_account_id' => $validated['bank_account_id'],
            'reconciliation_date' => $validated['reconciliation_date'],
            'statement_balance' => $validated['statement_balance'],
            'book_balance' => $bookBalance,
            'difference' => $validated['statement_balance'] - $bookBalance,
            'status' => 'draft',
            'notes' => $validated['notes'] ?? null,
            'reconciled_by' => $request->user()->id,
        ]);

        return response()->json($reconciliation->load('bankAccount'), 201);
    }

    public function show(Request $request, BankReconciliation $bankReconciliation)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($bankReconciliation->business_id !== $businessId) abort(403);

        $bankReconciliation->load(['bankAccount', 'reconciler']);

        $unreconciledTransactions = BankTransaction::where('bank_account_id', $bankReconciliation->bank_account_id)
            ->where('is_reconciled', false)
            ->where('transaction_date', '<=', $bankReconciliation->reconciliation_date)
            ->orderBy('transaction_date')
            ->get();

        return response()->json([
            'reconciliation' => $bankReconciliation,
            'unreconciled_transactions' => $unreconciledTransactions,
        ]);
    }

    public function reconcile(Request $request, BankReconciliation $bankReconciliation)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($bankReconciliation->business_id !== $businessId) abort(403);

        if ($bankReconciliation->status !== 'draft') {
            return response()->json(['message' => 'Only draft reconciliations can be finalized'], 422);
        }

        $validated = $request->validate([
            'transaction_ids' => 'required|array',
            'transaction_ids.*' => 'exists:bank_transactions,id',
        ]);

        DB::transaction(function () use ($bankReconciliation, $validated) {
            BankTransaction::whereIn('id', $validated['transaction_ids'])
                ->update(['is_reconciled' => true, 'reconciled_at' => now()]);

            $reconciledTotal = BankTransaction::whereIn('id', $validated['transaction_ids'])->sum('amount');
            $newBookBalance = $bankReconciliation->book_balance + $reconciledTotal;

            $bankReconciliation->update([
                'status' => 'reconciled',
                'book_balance' => $newBookBalance,
                'difference' => $bankReconciliation->statement_balance - $newBookBalance,
            ]);

            $bankAccount = BankAccount::find($bankReconciliation->bank_account_id);
            if ($bankAccount) {
                $bankAccount->update(['current_balance' => $newBookBalance]);
            }
        });

        return response()->json($bankReconciliation);
    }

    public function destroy(Request $request, BankReconciliation $bankReconciliation)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($bankReconciliation->business_id !== $businessId) abort(403);

        if ($bankReconciliation->status === 'reconciled') {
            return response()->json(['message' => 'Cannot delete reconciled record'], 422);
        }

        $bankReconciliation->delete();
        return response()->json(['message' => 'Reconciliation deleted']);
    }
}
