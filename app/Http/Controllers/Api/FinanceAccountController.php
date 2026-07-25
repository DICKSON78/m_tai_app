<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Business;
use Illuminate\Http\Request;

class FinanceAccountController extends Controller
{
    public function index(Request $request)
    {
        $business = Business::findOrFail($request->user()->current_business_id ?? $request->user()->businesses()->first()?->id);
        $accounts = Account::where('business_id', $business->id)
            ->when($request->type, fn($q, $v) => $q->where('type', $v))
            ->when($request->search, fn($q, $v) => $q->where('name', 'like', "%{$v}%")->orWhere('code', 'like', "%{$v}%"))
            ->orderBy('code')
            ->paginate($request->per_page ?? 50);
        return response()->json($accounts);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:20',
            'name' => 'required|string|max:255',
            'type' => 'required|in:asset,liability,equity,revenue,expense',
            'sub_type' => 'nullable|string|max:50',
            'description' => 'nullable|string',
            'opening_balance' => 'nullable|numeric|min:0',
        ]);
        $business = Business::findOrFail($request->user()->current_business_id ?? $request->user()->businesses()->first()?->id);
        $validated['business_id'] = $business->id;
        $validated['is_active'] = true;
        $account = Account::create($validated);
        return response()->json($account, 201);
    }

    public function show(Request $request, Account $account)
    {
        $this->authorizeAccount($request, $account);
        return response()->json($account);
    }

    public function update(Request $request, Account $account)
    {
        $this->authorizeAccount($request, $account);
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'sometimes|boolean',
            'opening_balance' => 'nullable|numeric|min:0',
        ]);
        $account->update($validated);
        return response()->json($account);
    }

    public function destroy(Request $request, Account $account)
    {
        $this->authorizeAccount($request, $account);
        if ($account->journalEntryLines()->exists() || $account->invoices()->exists() || $account->bills()->exists()) {
            return response()->json(['message' => 'Cannot delete account with existing transactions'], 422);
        }
        $account->delete();
        return response()->json(['message' => 'Account deleted']);
    }

    private function authorizeAccount(Request $request, Account $account)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($account->business_id !== $businessId) abort(403);
    }
}
