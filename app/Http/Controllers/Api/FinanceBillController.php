<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Bill;
use App\Models\BillItem;
use App\Models\Business;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FinanceBillController extends Controller
{
    public function index(Request $request)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $bills = Bill::where('business_id', $businessId)
            ->when($request->status, fn($q, $v) => $q->where('status', $v))
            ->when($request->search, fn($q, $v) => $q->where('bill_number', 'like', "%{$v}%")->orWhere('vendor_name', 'like', "%{$v}%"))
            ->orderBy('date', 'desc')
            ->paginate($request->per_page ?? 20);
        return response()->json($bills);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'vendor_name' => 'required|string|max:255',
            'bill_number' => 'required|string|max:50',
            'date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:date',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.description' => 'required|string',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.tax_rate' => 'nullable|numeric|min:0|max:100',
        ]);

        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;

        $bill = DB::transaction(function () use ($validated, $businessId) {
            $subtotal = 0;
            $taxAmount = 0;
            foreach ($validated['items'] as $item) {
                $lineAmount = $item['quantity'] * $item['unit_price'];
                $subtotal += $lineAmount;
                $taxAmount += $lineAmount * ($item['tax_rate'] ?? 0) / 100;
            }

            $bill = Bill::create([
                'business_id' => $businessId,
                'vendor_name' => $validated['vendor_name'],
                'bill_number' => $validated['bill_number'],
                'date' => $validated['date'],
                'due_date' => $validated['due_date'],
                'notes' => $validated['notes'] ?? null,
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'total' => $subtotal + $taxAmount,
                'status' => 'draft',
            ]);

            foreach ($validated['items'] as $item) {
                BillItem::create([
                    'bill_id' => $bill->id,
                    'description' => $item['description'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'tax_rate' => $item['tax_rate'] ?? 0,
                    'amount' => $item['quantity'] * $item['unit_price'],
                ]);
            }

            return $bill;
        });

        return response()->json($bill->load('items'), 201);
    }

    public function show(Request $request, Bill $bill)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($bill->business_id !== $businessId) abort(403);
        return response()->json($bill->load('items'));
    }

    public function update(Request $request, Bill $bill)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($bill->business_id !== $businessId) abort(403);
        $validated = $request->validate([
            'status' => 'sometimes|in:draft,received,paid,partial,overdue,cancelled',
            'notes' => 'nullable|string',
        ]);
        $bill->update($validated);
        return response()->json($bill);
    }

    public function recordPayment(Request $request, Bill $bill)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($bill->business_id !== $businessId) abort(403);
        $validated = $request->validate(['amount' => 'required|numeric|min:0.01']);
        $bill->amount_paid += $validated['amount'];
        $bill->status = $bill->amount_paid >= $bill->total ? 'paid' : 'partial';
        $bill->save();
        return response()->json($bill);
    }

    public function destroy(Request $request, Bill $bill)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($bill->business_id !== $businessId) abort(403);
        $bill->items()->delete();
        $bill->delete();
        return response()->json(['message' => 'Bill deleted']);
    }
}
