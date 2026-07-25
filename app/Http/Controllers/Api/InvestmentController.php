<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Investment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InvestmentController extends Controller
{
    const ALLOCATIONS = [
        'investment_account' => 50,
        'life_insurance' => 20,
        'normal_savings' => 15,
        'wallet' => 5,
        'bata_account' => 10,
    ];

    const TYPE_LABELS = [
        'investment_account' => 'Akaunti ya Uwekezaji',
        'life_insurance' => 'Bima ya Maisha',
        'normal_savings' => 'Akiba ya Kawaida',
        'wallet' => 'Mtandao (Wallet)',
        'bata_account' => 'Akaunti ya BATA',
    ];

    public function index(Request $request, Business $business)
    {
        $this->authorizeBusiness($request, $business);

        $investments = $business->investments()
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 20);

        $totals = $business->investments()
            ->selectRaw('type, SUM(amount) as total')
            ->groupBy('type')
            ->pluck('total', 'type')
            ->toArray();

        $grandTotal = array_sum($totals);

        return response()->json(array_merge($investments->toArray(), [
            'totals' => $totals,
            'grand_total' => $grandTotal,
            'allocations' => self::ALLOCATIONS,
            'type_labels' => self::TYPE_LABELS,
        ]));
    }

    public function allocate(Request $request, Business $business)
    {
        $this->authorizeBusiness($request, $business);

        $validated = $request->validate([
            'amount' => 'required|numeric|min:1',
            'date' => 'nullable|date',
            'description' => 'nullable|string|max:500',
        ]);

        $amount = $validated['amount'];
        $date = $validated['date'] ?? now()->toDateString();
        $description = $validated['description'] ?? 'Ugawaji wa mapato';

        $created = [];

        DB::transaction(function () use ($business, $amount, $date, $description, &$created) {
            foreach (self::ALLOCATIONS as $type => $percent) {
                $allocated = round($amount * $percent / 100, 2);
                if ($allocated > 0) {
                    $inv = $business->investments()->create([
                        'amount' => $allocated,
                        'type' => $type,
                        'date' => $date,
                        'description' => "{$description} - {$percent}% = TZS " . number_format($allocated),
                    ]);
                    $created[] = $inv;
                }
            }
        });

        return response()->json([
            'message' => 'Kiasi kimegawanywa kwa mafanikio.',
            'total_amount' => $amount,
            'investments' => $created,
        ], 201);
    }

    public function store(Request $request, Business $business)
    {
        $this->authorizeBusiness($request, $business);

        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'type' => 'required|in:investment_account,life_insurance,normal_savings,wallet,bata_account',
            'description' => 'nullable|string|max:500',
            'date' => 'nullable|date',
        ]);

        $investment = $business->investments()->create([
            'amount' => $validated['amount'],
            'type' => $validated['type'],
            'description' => $validated['description'] ?? null,
            'date' => $validated['date'] ?? now()->toDateString(),
        ]);

        return response()->json([
            'message' => 'Uwekezaji umerekodwa kwa mafanikio.',
            'investment' => $investment,
        ], 201);
    }

    public function destroy(Request $request, Business $business, Investment $investment)
    {
        $this->authorizeBusiness($request, $business);

        if ($investment->business_id !== $business->id) {
            abort(403, 'Huna ruhusa ya kufuta uwekezaji huu.');
        }

        $investment->delete();

        return response()->json(['message' => 'Uwekezaji umefutwa.']);
    }

    protected function authorizeBusiness(Request $request, Business $business)
    {
        if ($business->user_id !== $request->user()->id) {
            abort(403, 'Huna ruhusa ya kufanya operesheni hii.');
        }
    }
}
