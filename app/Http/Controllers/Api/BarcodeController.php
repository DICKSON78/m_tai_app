<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Services\Ean13;
use Illuminate\Http\Request;

class BarcodeController extends Controller
{
    public function generate(Request $request, Product $product)
    {
        $user = $request->user();
        $isOwner = $user->businesses()->where('id', $product->business_id)->exists();
        $isEmployee = $user->employees()->where('business_id', $product->business_id)->exists();
        $isAdmin = $user->role === 'admin';

        if (! $isOwner && ! $isEmployee && ! $isAdmin) {
            abort(403);
        }

        $barcode = $this->gtinFor($product, $request->user());

        return response()->json([
            'barcode' => $barcode,
            'product' => $product->name,
            'svg' => Ean13::toSvg($barcode, $product->name),
        ]);
    }

    public function generateForOrder(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string',
            'items' => 'required|array|min:1',
        ]);

        $barcodes = [];

        foreach ($validated['items'] as $index => $item) {
            $name = $item['name'] ?? 'Bidhaa';
            // Stable 12-digit base per order item: item id when numeric,
            // otherwise the item's position within the order.
            $ref = is_numeric($item['id'] ?? null) ? (int) $item['id'] : $index + 1;
            $base = Ean13::GS1_PREFIX
                . str_pad(substr((string) $ref, 0, 9), 9, '0', STR_PAD_LEFT);

            $barcodes[] = [
                'id' => $item['id'] ?? null,
                'name' => $name,
                'barcode' => $base.Ean13::computeCheckDigit($base),
                'svg' => Ean13::toSvg($base.Ean13::computeCheckDigit($base), $name),
            ];
        }

        return response()->json([
            'order_code' => $validated['code'],
            'barcodes' => $barcodes,
        ]);
    }

    /**
     * Prefer a manually-entered product barcode when it is a valid EAN-13;
     * otherwise derive a stable, unique GTIN-13 from business + product id.
     */
    protected function gtinFor(Product $product, $user): string
    {
        if ($product->barcode && preg_match('/^\d{12}$/', $product->barcode)) {
            $manual = $product->barcode.Ean13::computeCheckDigit($product->barcode);
            if (Ean13::isValid($manual)) {
                return $manual;
            }
        }

        if ($product->barcode && preg_match('/^\d{13}$/', $product->barcode) && Ean13::isValid($product->barcode)) {
            return $product->barcode;
        }

        return Ean13::forProduct($product->business_id, $product->id);
    }
}