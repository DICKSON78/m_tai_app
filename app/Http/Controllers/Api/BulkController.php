<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Order;
use App\Models\Expense;
use Illuminate\Http\Request;

class BulkController extends Controller
{
    public function updateProductPrices(Request $request)
    {
        $request->validate([
            'product_ids' => 'required|array',
            'product_ids.*' => 'exists:products,id',
            'field' => 'required|in:buying_price,selling_price,wholesale_price,retail_price',
            'action' => 'required|in:set,increase,decrease',
            'value' => 'required|numeric|min:0',
        ]);

        $updated = 0;
        foreach ($request->product_ids as $id) {
            $product = Product::findOrFail($id);
            $newValue = match($request->action) {
                'set' => $request->value,
                'increase' => $product->{$request->field} + $request->value,
                'decrease' => max(0, $product->{$request->field} - $request->value),
            };
            $product->update([$request->field => $newValue]);
            $updated++;
        }

        return response()->json(['message' => "{$updated} products updated", 'updated' => $updated]);
    }

    public function updateOrderStatus(Request $request)
    {
        $request->validate([
            'order_ids' => 'required|array',
            'order_ids.*' => 'exists:orders,id',
            'status' => 'required|in:pending,processing,completed,cancelled',
        ]);

        $updated = Order::whereIn('id', $request->order_ids)->update(['status' => $request->status]);
        return response()->json(['message' => "{$updated} orders updated", 'updated' => $updated]);
    }

    public function deleteExpenses(Request $request)
    {
        $request->validate([
            'expense_ids' => 'required|array',
            'expense_ids.*' => 'exists:expenses,id',
        ]);

        $deleted = Expense::whereIn('id', $request->expense_ids)->delete();
        return response()->json(['message' => "{$deleted} expenses deleted", 'deleted' => $deleted]);
    }
}
