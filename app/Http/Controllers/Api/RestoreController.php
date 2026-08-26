<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Customer;
use App\Models\Expense;
use App\Models\Delivery;
use Illuminate\Http\Request;

class RestoreController extends Controller
{
    protected $models = [
        'orders' => Order::class,
        'customers' => Customer::class,
        'expenses' => Expense::class,
        'deliveries' => Delivery::class,
    ];

    public function trashed(Request $request, string $model)
    {
        $class = $this->getModel($model);
        $items = $class::onlyTrashed()
            ->orderBy('deleted_at', 'desc')
            ->paginate($request->input('per_page', 20));

        return response()->json($items);
    }

    public function restore(Request $request, string $model, $id)
    {
        $class = $this->getModel($model);
        $item = $class::onlyTrashed()->findOrFail($id);
        $item->restore();

        return response()->json(['message' => 'Restored successfully', 'item' => $item]);
    }

    public function forceDelete(Request $request, string $model, $id)
    {
        $class = $this->getModel($model);
        $item = $class::onlyTrashed()->findOrFail($id);
        $item->forceDelete();

        return response()->json(['message' => 'Permanently deleted']);
    }

    protected function getModel(string $model)
    {
        abort_unless(isset($this->models[$model]), 404);
        return $this->models[$model];
    }
}
