<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use Illuminate\Http\Request;

class ExportController extends Controller
{
    public function products(Request $request, Business $business)
    {
        if ($business->user_id !== $request->user()->id) {
            abort(403);
        }

        $products = $business->products()->with('category:id,name')->get();

        $csv = "Name,Category,Buying Price,Selling Price,Quantity,Value\n";
        foreach ($products as $p) {
            $catName = $p->category->name ?? '';
            $name = str_replace('"', '""', $p->name);
            $catName = str_replace('"', '""', $catName);
            $csv .= "\"{$name}\",\"{$catName}\",{$p->buying_price},{$p->selling_price},{$p->quantity}," . ($p->quantity * $p->buying_price) . "\n";
        }

        return response($csv)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="products_' . date('Y-m-d') . '.csv"');
    }

    public function orders(Request $request, Business $business)
    {
        if ($business->user_id !== $request->user()->id) {
            abort(403);
        }

        $orders = $business->orders()->with('customer:id,full_name,phone')->get();

        $csv = "Transaction Code,Date,Customer,Total,Status\n";
        foreach ($orders as $o) {
            $customerName = $o->customer->full_name ?? 'Guest';
            $customerName = str_replace('"', '""', $customerName);
            $csv .= "\"{$o->transaction_code}\",\"{$o->created_at->format('d/m/Y')}\",\"{$customerName}\",{$o->total},\"{$o->status}\"\n";
        }

        return response($csv)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="orders_' . date('Y-m-d') . '.csv"');
    }

    public function expenses(Request $request, Business $business)
    {
        if ($business->user_id !== $request->user()->id) {
            abort(403);
        }

        $expenses = $business->expenses()->get();

        $csv = "Date,Category,Description,Type,Amount\n";
        foreach ($expenses as $e) {
            $desc = str_replace('"', '""', $e->description ?? '');
            $csv .= "\"{$e->date->format('d/m/Y')}\",\"{$e->category}\",\"{$desc}\",\"{$e->type}\",{$e->amount}\n";
        }

        return response($csv)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="expenses_' . date('Y-m-d') . '.csv"');
    }
}
