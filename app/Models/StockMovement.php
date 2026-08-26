<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockMovement extends Model
{
    use HasFactory;

    protected $fillable = [
        'business_id', 'product_id', 'batch_id', 'type', 'quantity',
        'unit_cost', 'balance_after',
        'reference_type', 'reference_id', 'notes', 'moved_by',
    ];

    const TYPES = [
        'in', 'out', 'adjustment', 'sale', 'sale_return',
        'purchase_receipt', 'purchase_return', 'damage', 'transfer',
        'manufacturing_output',
    ];

    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function batch()
    {
        return $this->belongsTo(StockBatch::class);
    }

    public function movedBy()
    {
        return $this->belongsTo(User::class, 'moved_by');
    }

    public function getIsInboundAttribute()
    {
        return in_array($this->type, ['in', 'sale_return', 'purchase_receipt']);
    }
}
