<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchaseReceptionItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'business_id', 'purchase_reception_id', 'purchase_order_item_id',
        'product_id', 'ordered_quantity', 'received_quantity', 'accepted_quantity',
        'rejected_quantity', 'inspection_status', 'rejection_reason',
        'batch_number', 'expiry_date', 'warehouse_location',
    ];

    protected function casts(): array
    {
        return [
            'ordered_quantity' => 'decimal:2',
            'received_quantity' => 'decimal:2',
            'accepted_quantity' => 'decimal:2',
            'rejected_quantity' => 'decimal:2',
            'expiry_date' => 'date',
        ];
    }

    public function purchaseReception() { return $this->belongsTo(PurchaseReception::class); }
    public function purchaseOrderItem() { return $this->belongsTo(PurchaseOrderItem::class); }
    public function product() { return $this->belongsTo(Product::class); }
}
