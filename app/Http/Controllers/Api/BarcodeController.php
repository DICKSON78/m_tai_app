<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class BarcodeController extends Controller
{
    public function generate(Request $request, Product $product)
    {
        $user = $request->user();
        $isOwner = $user->businesses()->where('id', $product->business_id)->exists();
        $isEmployee = $user->employees()->where('business_id', $product->business_id)->exists();
        $isAdmin = $user->role === 'admin';

        if (!$isOwner && !$isEmployee && !$isAdmin) {
            abort(403);
        }

        $barcode = str_pad($product->id, 12, '0', STR_PAD_LEFT);

        $html = $this->generateBarcodeHtml($barcode, $product->name);

        return response()->json([
            'barcode' => $barcode,
            'product' => $product->name,
            'html' => $html,
        ]);
    }

    public function generateForOrder(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string',
            'items' => 'required|array|min:1',
        ]);

        $barcodes = [];
        foreach ($validated['items'] as $item) {
            $barcode = str_pad($item['id'] ?? rand(1, 999999), 12, '0', STR_PAD_LEFT);
            $barcodes[] = [
                'id' => $item['id'] ?? null,
                'name' => $item['name'] ?? 'Bidhaa',
                'barcode' => $barcode,
            ];
        }

        return response()->json([
            'order_code' => $validated['code'],
            'barcodes' => $barcodes,
        ]);
    }

    protected function generateBarcodeHtml($code, $label)
    {
        $bars = '';
        $widths = [2,1,1,2,1,1,2,1,2,1,1,2,1,1,2,1,2,1,1,2,1,1,2,1,1,2,1,2,1,1,2];

        for ($i = 0; $i < strlen($code); $i++) {
            $digit = (int)$code[$i];
            $bars .= "<div style='display:inline-block;width:{$widths[$i % count($widths)]}px;height:40px;background:#000;margin-right:1px;'></div>";
            $bars .= "<div style='display:inline-block;width:1px;height:40px;background:#fff;margin-right:1px;'></div>";
        }

        return <<<HTML
<div style="text-align:center;font-family:monospace;">
    <div style="margin-bottom:4px;">{$bars}</div>
    <div style="font-size:12px;letter-spacing:2px;">{$code}</div>
    <div style="font-size:10px;margin-top:2px;">{$label}</div>
</div>
HTML;
    }
}
