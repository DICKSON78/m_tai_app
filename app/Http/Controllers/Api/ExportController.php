<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class ExportController extends Controller
{
    protected const BRAND = '00D4AA';
    protected const DARK = '0F172A';

    protected function exportAsCsv(array $headers, array $data, string $filename)
    {
        $escape = fn ($value) => '"' . str_replace('"', '""', (string) $value) . '"';

        $csv = "\xEF\xBB\xBF" . implode(',', array_map($escape, $headers)) . "\n";
        foreach ($data as $row) {
            $csv .= implode(',', array_map($escape, $row)) . "\n";
        }

        return response($csv)
            ->header('Content-Type', 'text/csv; charset=UTF-8')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '_' . date('Y-m-d') . '.csv"');
    }

    protected function exportAsExcel(array $headers, array $data, string $filename, array $meta = [])
    {
        $spreadsheet = new Spreadsheet();
        $spreadsheet->getProperties()
            ->setCreator('M-TAI')
            ->setTitle($meta['title'] ?? $filename);
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle($meta['sheet'] ?? 'Data');

        $lastCol = Coordinate::stringFromColumnIndex(count($headers));
        $headerRow = 1;

        $sheet->setCellValue('A1', $meta['title'] ?? ucfirst($filename));
        $sheet->mergeCells("A1:{$lastCol}1");
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14)->getColor()->setARGB('FFFFFFFF');
        $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT)->setVertical(Alignment::VERTICAL_CENTER);
        $sheet->getStyle("A1:{$lastCol}1")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FF' . self::DARK);
        $sheet->getRowDimension(1)->setRowHeight(28);

        $businessName = $meta['business'] ?? null;
        if ($businessName) {
            $sheet->setCellValue('A2', $businessName . '  •  Generated ' . date('d/m/Y H:i'));
            $sheet->mergeCells("A2:{$lastCol}2");
            $sheet->getStyle('A2')->getFont()->setItalic(true)->setSize(10)->getColor()->setARGB('FF64748B');
            $headerRow = 3;
        }

        $headerRow++;
        foreach ($headers as $col => $header) {
            $cell = Coordinate::stringFromColumnIndex($col + 1) . $headerRow;
            $sheet->setCellValue($cell, $header);
        }
        $headerRange = 'A' . $headerRow . ':' . $lastCol . $headerRow;
        $sheet->getStyle($headerRange)->getFont()->setBold(true)->getColor()->setARGB('FFFFFFFF');
        $sheet->getStyle($headerRange)->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FF' . self::BRAND);
        $sheet->getStyle($headerRange)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT)->setVertical(Alignment::VERTICAL_CENTER);
        $sheet->getRowDimension($headerRow)->setRowHeight(22);

        $startRow = $headerRow + 1;
        $r = $startRow;
        foreach ($data as $row) {
            foreach ($headers as $col => $_) {
                $cell = Coordinate::stringFromColumnIndex($col + 1) . $r;
                $sheet->setCellValue($cell, $row[$col] ?? '');
            }
            $r++;
        }
        $endRow = max($startRow, $r - 1);

        if ($r > $startRow) {
            $dataRange = 'A' . $startRow . ':' . $lastCol . $endRow;
            $sheet->getStyle($dataRange)->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN)->getColor()->setARGB('FFE2E8F0');
            for ($row = $startRow; $row <= $endRow; $row++) {
                if (($row - $startRow) % 2 === 1) {
                    $sheet->getStyle('A' . $row . ':' . $lastCol . $row)->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FFF8FAFC');
                }
            }
        }

        $totals = $meta['totals'] ?? null;
        if ($totals && $r > $startRow) {
            $row = $endRow + 1;
            $sheet->setCellValue('A' . $row, $totals['label'] ?? 'Total');
            $sheet->mergeCells('A' . $row . ':' . Coordinate::stringFromColumnIndex(max(1, count($headers) - 1)) . $row);
            $sheet->setCellValue($lastCol . $row, $totals['value'] ?? '');
            $sheet->getStyle('A' . $row . ':' . $lastCol . $row)->getFont()->setBold(true);
            $sheet->getStyle('A' . $row . ':' . $lastCol . $row)->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FFECFDF5');
            $sheet->getStyle($lastCol . $row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        }

        foreach ($headers as $col => $_) {
            $sheet->getColumnDimension(Coordinate::stringFromColumnIndex($col + 1))->setAutoSize(true);
        }
        $sheet->freezePane('A' . ($startRow));

        $writer = new Xlsx($spreadsheet);
        $tempFile = tempnam(sys_get_temp_dir(), 'export_') . '.xlsx';
        $writer->save($tempFile);

        return response()->download($tempFile, "{$filename}_" . date('Y-m-d') . ".xlsx")->deleteFileAfterSend(true);
    }

    protected function format(?string $format): string
    {
        return strtolower($format ?? 'csv') === 'xlsx' ? 'xlsx' : 'csv';
    }

    protected function authorizeBusiness(Request $request, Business $business): void
    {
        if ($business->user_id !== $request->user()->id) {
            abort(403);
        }
    }

    protected function validateExport(Request $request): array
    {
        return $request->validate([
            'format' => 'nullable|string|in:csv,xlsx',
            'limit' => 'nullable|integer|min:1|max:10000',
        ], [
            'format.in' => 'Muundo haujulikani. Tumia csv au xlsx.',
            'limit.max' => 'Wingi wa juu ni nyuzi 10,000 tu.',
        ]);
    }

    public function products(Request $request, Business $business)
    {
        $this->authorizeBusiness($request, $business);
        $this->validateExport($request);

        $limit = min((int) $request->input('limit', 10000), 10000);
        $products = $business->products()->with('category:id,name')->limit($limit)->get();

        $headers = ['Name', 'Category', 'Buying Price', 'Selling Price', 'Quantity', 'Value'];
        $data = $products->map(fn ($p) => [
            $p->name,
            $p->category->name ?? '',
            (float) $p->buying_price,
            (float) $p->selling_price,
            (int) $p->quantity,
            (float) $p->quantity * (float) $p->buying_price,
        ])->toArray();

        $meta = [
            'title' => 'Products',
            'sheet' => 'Products',
            'business' => $business->name,
            'totals' => ['label' => 'Total stock value', 'value' => array_sum(array_column($data, 5))],
        ];

        return $this->format($request->format) === 'xlsx'
            ? $this->exportAsExcel($headers, $data, 'products', $meta)
            : $this->exportAsCsv($headers, $data, 'products');
    }

    public function orders(Request $request, Business $business)
    {
        $this->authorizeBusiness($request, $business);
        $this->validateExport($request);

        $limit = min((int) $request->input('limit', 10000), 10000);
        $orders = $business->orders()->with('customer:id,full_name,phone')->limit($limit)->get();

        $headers = ['Transaction Code', 'Date', 'Customer', 'Total', 'Status'];
        $data = $orders->map(fn ($o) => [
            $o->transaction_code,
            $o->created_at->format('d/m/Y'),
            $o->customer->full_name ?? 'Guest',
            (float) $o->total,
            ucfirst($o->status),
        ])->toArray();

        $meta = [
            'title' => 'Orders',
            'sheet' => 'Orders',
            'business' => $business->name,
            'totals' => ['label' => 'Total sales', 'value' => array_sum(array_column($data, 3))],
        ];

        return $this->format($request->format) === 'xlsx'
            ? $this->exportAsExcel($headers, $data, 'orders', $meta)
            : $this->exportAsCsv($headers, $data, 'orders');
    }

    public function expenses(Request $request, Business $business)
    {
        $this->authorizeBusiness($request, $business);
        $this->validateExport($request);

        $limit = min((int) $request->input('limit', 10000), 10000);
        $expenses = $business->expenses()->limit($limit)->get();

        $headers = ['Date', 'Category', 'Description', 'Type', 'Amount'];
        $data = $expenses->map(fn ($e) => [
            $e->date?->format('d/m/Y') ?? '',
            $e->category,
            $e->description ?? '',
            ucfirst($e->type),
            (float) $e->amount,
        ])->toArray();

        $meta = [
            'title' => 'Expenses',
            'sheet' => 'Expenses',
            'business' => $business->name,
            'totals' => ['label' => 'Total expenses', 'value' => array_sum(array_column($data, 4))],
        ];

        return $this->format($request->format) === 'xlsx'
            ? $this->exportAsExcel($headers, $data, 'expenses', $meta)
            : $this->exportAsCsv($headers, $data, 'expenses');
    }
}
