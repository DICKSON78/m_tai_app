<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SupplierPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'business_id', 'supplier_id', 'supplier_invoice_id', 'purchase_order_id',
        'payment_number', 'payment_date', 'payment_method', 'reference_number',
        'amount', 'currency', 'exchange_rate', 'local_amount', 'withholding_tax',
        'discount_taken', 'notes', 'status', 'bank_account_id', 'received_by', 'confirmed_by',
    ];

    protected function casts(): array
    {
        return [
            'payment_date' => 'date',
            'exchange_rate' => 'decimal:6',
            'amount' => 'decimal:2',
            'local_amount' => 'decimal:2',
            'withholding_tax' => 'decimal:2',
            'discount_taken' => 'decimal:2',
        ];
    }

    public function business() { return $this->belongsTo(Business::class); }
    public function supplier() { return $this->belongsTo(Supplier::class); }
    public function invoice() { return $this->belongsTo(SupplierInvoice::class, 'supplier_invoice_id'); }
    public function purchaseOrder() { return $this->belongsTo(PurchaseOrder::class); }
    public function bankAccount() { return $this->belongsTo(BankAccount::class); }
    public function receiver() { return $this->belongsTo(User::class, 'received_by'); }
    public function confirmer() { return $this->belongsTo(User::class, 'confirmed_by'); }
}
