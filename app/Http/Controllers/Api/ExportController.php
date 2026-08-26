<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class ExportController extends Controller
{
    protected function exportAsCsv(array $rows, string $headerCsv, string $filename)
    {
        return response($headerCsv . $rows)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '_' . date('Y-m-d') . '.csv"');
    }

    protected function exportAsExcel(array $headers, array $data, string $filename)
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        foreach ($headers as $col => $header) {
            $sheet->setCellValueByColumnAndRow($col + 1, 1, $header);
        }

        foreach ($data as $row => $item) {
            foreach ($headers as $col => $header) {
                $sheet->setCellValueByColumnAndRow($col + 1, $row + 2, $item[$col] ?? '');
            }
        }

        $headerStyle = [
            'font' => ['bold' => true],
            'fill' => [
                'fillType' => 'solid',
                'startColor' => ['rgb' => '00D4AA'],
            ],
        ];
        $sheet->getStyle('A1:' . $sheet->getHighestColumn() . '1')->applyFromArray($headerStyle);

        foreach ($headers as $col => $header) {
            $sheet->getColumnDimension($sheet->getColumnByColumnAndRow($col + 1))->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);
        $tempFile = tempnam(sys_get_temp_dir(), 'export_');
        $writer->save($tempFile);

        return response()->download($tempFile, "{$filename}_" . date('Y-m-d') . ".xlsx")->deleteFileAfterSend(true);
    }

    protected function format(?string $format): string
    {
        return strtolower($format ?? 'csv') === 'xlsx' ? 'xlsx' : 'csv';
    }

    public function products(Request $request, Business $business)
    {
        if ($business->user_id !== $request->user()->id) {
            abort(403);
        }

        $request->validate([
            'format' => 'nullable|string|in:csv,xlsx',
            'limit' => 'nullable|integer|min:1|max:10000',
        ], [
            'format.in' => 'Muundo haujulikani. Tumia csv au xlsx.',
            'limit.max' => 'Wingi wa juu ni nyuzi 10,000 tu.',
        ]);

        $limit = min((int) $request->input('limit', 10000), 10000);
        $products = $business->products()->with('category:id,name')->limit($limit)->get();

        $headers = ['Name', 'Category', 'Buying Price', 'Selling Price', 'Quantity', 'Value'];

        if ($this->format($request->format) === 'xlsx') {
            $data = $products->map(fn($p) => [
                $p->name,
                $p->category->name ?? '',
                $p->buying_price,
                $p->selling_price,
                $p->quantity,
                $p->quantity * $p->buying_price,
            ])->toArray();

            return $this->exportAsExcel($headers, $data, 'products');
        }

        $csv = "Name,Category,Buying Price,Selling Price,Quantity,Value\n";
        foreach ($products as $p) {
            $catName = $p->category->name ?? '';
            $name = str_replace('"', '""', $p->name);
            $catName = str_replace('"', '""', $catName);
            $csv .= "\"{$name}\",\"{$catName}\",{$p->buying_price},{$p->selling_price},{$p->quantity}," . ($p->quantity * $p->buying_price) . "\n";
        }

        return $this->exportAsCsv($csv, '', 'products');
    }

    public function orders(Request $request, Business $business)
    {
        if ($business->user_id !== $request->user()->id) {
            abort(403);
        }

        $request->validate([
            'format' => 'nullable|string|in:csv,xlsx',
            'limit' => 'nullable|integer|min:1|max:10000',
        ], [
            'format.in' => 'Muundo haujulikani. Tumia csv au xlsx.',
            'limit.max' => 'Wingi wa juu ni nyuzi 10,000 tu.',
        ]);

        $limit = min((int) $request->input('limit', 10000), 10000);
        $orders = $business->orders()->with('customer:id,full_name,phone', 'items.product:id,name')->limit($limit)->get();

        $headers = ['Transaction Code', 'Date', 'Customer', 'Total', 'Status'];

        if ($this->format($request->format) === 'xlsx') {
            $data = $orders->map(fn($o) => [
                $o->transaction_code,
                $o->created_at->format('d/m/Y'),
                $o->customer->full_name ?? 'Guest',
                $o->total,
                $o->status,
            ])->toArray();

            return $this->exportAsExcel($headers, $data, 'orders');
        }

        $csv = "Transaction Code,Date,Customer,Total,Status\n";
        foreach ($orders as $o) {
            $customerName = $o->customer->full_name ?? 'Guest';
            $customerName = str_replace('"', '""', $customerName);
            $csv .= "\"{$o->transaction_code}\",\"{$o->created_at->format('d/m/Y')}\",\"{$customerName}\",{$o->total},\"{$o->status}\"\n";
        }

        return $this->exportAsCsv($csv, '', 'orders');
    }

    public function expenses(Request $request, Business $business)
    {
        if ($business->user_id !== $request->user()->id) {
            abort(403);
        }

        $request->validate([
            'format' => 'nullable|string|in:csv,xlsx',
            'limit' => 'nullable|integer|min:1|max:10000',
        ], [
            'format.in' => 'Muundo haujulikani. Tumia csv au xlsx.',
            'limit.max' => 'Wingi wa juu ni nyuzi 10,000 tu.',
        ]);

        $limit = min((int) $request->input('limit', 10000), 10000);
        $expenses = $business->expenses()->limit($limit)->get();

        $headers = ['Date', 'Category', 'Description', 'Type', 'Amount'];

        if ($this->format($request->format) === 'xlsx') {
            $data = $expenses->map(fn($e) => [
                $e->date->format('d/m/Y'),
                $e->category,
                $e->description ?? '',
                $e->type,
                $e->amount,
            ])->toArray();

            return $this->exportAsExcel($headers, $data, 'expenses');
        }

        $csv = "Date,Category,Description,Type,Amount\n";
        foreach ($expenses as $e) {
            $desc = str_replace('"', '""', $e->description ?? '');
            $csv .= "\"{$e->date->format('d/m/Y')}\",\"{$e->category}\",\"{$desc}\",\"{$e->type}\",{$e->amount}\n";
        }

        return $this->exportAsCsv($csv, '', 'expenses');
    }
}
