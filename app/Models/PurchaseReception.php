<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PurchaseReception extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'business_id', 'purchase_order_id', 'supplier_id', 'grn_number',
        'reception_date', 'status', 'total_quantity', 'total_accepted',
        'total_rejected', 'notes', 'rejection_reason', 'received_by', 'inspected_by',
    ];

    protected function casts(): array
    {
        return [
            'reception_date' => 'date',
            'total_quantity' => 'decimal:2',
            'total_accepted' => 'decimal:2',
            'total_rejected' => 'decimal:2',
        ];
    }

    public function business() { return $this->belongsTo(Business::class); }
    public function purchaseOrder() { return $this->belongsTo(PurchaseOrder::class); }
    public function supplier() { return $this->belongsTo(Supplier::class); }
    public function items() { return $this->hasMany(PurchaseReceptionItem::class); }
    public function receiver() { return $this->belongsTo(User::class, 'received_by'); }
    public function inspector() { return $this->belongsTo(User::class, 'inspected_by'); }
}
