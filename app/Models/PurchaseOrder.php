<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PurchaseOrder extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'business_id', 'supplier_id', 'po_number', 'status', 'approval_status',
        'order_date', 'expected_date', 'received_date', 'currency', 'exchange_rate',
        'subtotal', 'discount_amount', 'tax_amount', 'shipping_cost', 'total',
        'amount_paid', 'payment_status', 'shipping_address_id', 'notes',
        'terms_conditions', 'created_by', 'approved_by', 'approved_at',
    ];

    protected function casts(): array
    {
        return [
            'order_date' => 'date',
            'expected_date' => 'date',
            'received_date' => 'date',
            'approved_at' => 'datetime',
            'exchange_rate' => 'decimal:6',
            'subtotal' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'shipping_cost' => 'decimal:2',
            'total' => 'decimal:2',
            'amount_paid' => 'decimal:2',
        ];
    }

    public function business() { return $this->belongsTo(Business::class); }
    public function supplier() { return $this->belongsTo(Supplier::class); }
    public function items() { return $this->hasMany(PurchaseOrderItem::class); }
    public function receptions() { return $this->hasMany(PurchaseReception::class); }
    public function invoices() { return $this->hasMany(SupplierInvoice::class); }
    public function payments() { return $this->hasMany(SupplierPayment::class); }
    public function creator() { return $this->belongsTo(User::class, 'created_by'); }
    public function approver() { return $this->belongsTo(User::class, 'approved_by'); }

    public function getBalanceAttribute()
    {
        return $this->total - $this->amount_paid;
    }

    public function getIsFullyReceivedAttribute()
    {
        return $this->items->every(fn($item) => $item->received_quantity >= $item->quantity);
    }

    public function getReceivedPercentageAttribute()
    {
        $totalQty = $this->items->sum('quantity');
        $receivedQty = $this->items->sum('received_quantity');
        return $totalQty > 0 ? round(($receivedQty / $totalQty) * 100, 1) : 0;
    }
}
