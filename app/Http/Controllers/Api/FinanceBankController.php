<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\BankAccount;
use App\Models\BankTransaction;
use App\Models\Business;
use Illuminate\Http\Request;

class FinanceBankController extends Controller
{
    public function index(Request $request)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $accounts = BankAccount::where('business_id', $businessId)->with('account:id,code,name')->get();
        return response()->json($accounts);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'account_id' => 'required|exists:accounts,id',
            'bank_name' => 'required|string|max:255',
            'account_name' => 'required|string|max:255',
            'account_number' => 'nullable|string|max:50',
            'sort_code' => 'nullable|string|max:20',
        ]);
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $validated['business_id'] = $businessId;
        $validated['balance'] = 0;
        $bankAccount = BankAccount::create($validated);
        return response()->json($bankAccount, 201);
    }

    public function show(Request $request, BankAccount $bankAccount)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($bankAccount->business_id !== $businessId) abort(403);
        return response()->json($bankAccount->load('account:id,code,name'));
    }

    public function transactions(Request $request, BankAccount $bankAccount)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($bankAccount->business_id !== $businessId) abort(403);
        $transactions = $bankAccount->transactions()
            ->when($request->date_from, fn($q, $v) => $q->where('date', '>=', $v))
            ->when($request->date_to, fn($q, $v) => $q->where('date', '<=', $v))
            ->orderBy('date', 'desc')
            ->paginate($request->per_page ?? 20);
        return response()->json($transactions);
    }

    public function addTransaction(Request $request, BankAccount $bankAccount)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($bankAccount->business_id !== $businessId) abort(403);
        $validated = $request->validate([
            'date' => 'required|date',
            'description' => 'required|string',
            'reference' => 'nullable|string',
            'type' => 'required|in:debit,credit',
            'amount' => 'required|numeric|min:0.01',
        ]);

        $transaction = new BankTransaction([
            'bank_account_id' => $bankAccount->id,
            'date' => $validated['date'],
            'description' => $validated['description'],
            'reference' => $validated['reference'] ?? null,
            $validated['type'] => $validated['amount'],
            $validated['type'] === 'debit' ? 'credit' : 'debit' => 0,
        ]);

        if ($validated['type'] === 'credit') {
            $bankAccount->balance += $validated['amount'];
        } else {
            $bankAccount->balance -= $validated['amount'];
        }
        $transaction->balance_after = $bankAccount->balance;
        $transaction->save();
        $bankAccount->save();

        return response()->json($transaction, 201);
    }

    public function destroy(Request $request, BankAccount $bankAccount)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($bankAccount->business_id !== $businessId) abort(403);
        $bankAccount->delete();
        return response()->json(['message' => 'Bank account deleted']);
    }
}
