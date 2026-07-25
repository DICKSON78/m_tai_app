<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\JournalEntry;
use App\Models\JournalEntryLine;
use App\Models\Business;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FinanceJournalController extends Controller
{
    public function index(Request $request)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $entries = JournalEntry::where('business_id', $businessId)
            ->with('lines.account:id,code,name')
            ->when($request->search, fn($q, $v) => $q->where('description', 'like', "%{$v}%")->orWhere('reference', 'like', "%{$v}%"))
            ->when($request->date_from, fn($q, $v) => $q->where('date', '>=', $v))
            ->when($request->date_to, fn($q, $v) => $q->where('date', '<=', $v))
            ->orderBy('date', 'desc')
            ->paginate($request->per_page ?? 20);
        return response()->json($entries);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'description' => 'required|string',
            'reference' => 'nullable|string|max:50',
            'lines' => 'required|array|min:2',
            'lines.*.account_id' => 'required|exists:accounts,id',
            'lines.*.debit' => 'required|numeric|min:0',
            'lines.*.credit' => 'required|numeric|min:0',
            'lines.*.description' => 'nullable|string',
        ]);

        $totalDebit = collect($validated['lines'])->sum('debit');
        $totalCredit = collect($validated['lines'])->sum('credit');
        if (abs($totalDebit - $totalCredit) > 0.01) {
            return response()->json(['message' => 'Total debits must equal total credits'], 422);
        }

        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;

        $entry = DB::transaction(function () use ($validated, $businessId, $totalDebit, $totalCredit, $request) {
            $entry = JournalEntry::create([
                'business_id' => $businessId,
                'date' => $validated['date'],
                'description' => $validated['description'],
                'reference' => $validated['reference'] ?? null,
                'total_debit' => $totalDebit,
                'total_credit' => $totalCredit,
                'is_posted' => true,
                'created_by' => $request->user()->id,
            ]);

            foreach ($validated['lines'] as $line) {
                JournalEntryLine::create([
                    'journal_entry_id' => $entry->id,
                    'account_id' => $line['account_id'],
                    'debit' => $line['debit'],
                    'credit' => $line['credit'],
                    'description' => $line['description'] ?? null,
                ]);
            }

            return $entry;
        });

        return response()->json($entry->load('lines.account'), 201);
    }

    public function show(Request $request, JournalEntry $journalEntry)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($journalEntry->business_id !== $businessId) abort(403);
        return response()->json($journalEntry->load('lines.account:id,code,name'));
    }

    public function destroy(Request $request, JournalEntry $journalEntry)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($journalEntry->business_id !== $businessId) abort(403);
        $journalEntry->lines()->delete();
        $journalEntry->delete();
        return response()->json(['message' => 'Journal entry deleted']);
    }
}
