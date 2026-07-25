<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class SupplierInvoice extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'business_id', 'supplier_id', 'purchase_order_id', 'invoice_number',
        'supplier_invoice_number', 'invoice_date', 'due_date', 'status', 'currency',
        'exchange_rate', 'subtotal', 'discount_amount', 'tax_amount', 'total',
        'amount_paid', 'withholding_tax', 'notes', 'payment_terms',
        'validated_by', 'validated_at',
    ];

    protected function casts(): array
    {
        return [
            'invoice_date' => 'date',
            'due_date' => 'date',
            'validated_at' => 'datetime',
            'exchange_rate' => 'decimal:6',
            'subtotal' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'total' => 'decimal:2',
            'amount_paid' => 'decimal:2',
            'withholding_tax' => 'decimal:2',
        ];
    }

    public function business() { return $this->belongsTo(Business::class); }
    public function supplier() { return $this->belongsTo(Supplier::class); }
    public function purchaseOrder() { return $this->belongsTo(PurchaseOrder::class); }
    public function payments() { return $this->hasMany(SupplierPayment::class); }
    public function validator() { return $this->belongsTo(User::class, 'validated_by'); }

    public function getBalanceAttribute()
    {
        return $this->total - $this->amount_paid;
    }

    public function getIsOverdueAttribute()
    {
        return $this->status !== 'paid' && $this->due_date->isPast();
    }

    public function getDaysUntilDueAttribute()
    {
        return $this->due_date->diffInDays(now(), false);
    }
}
