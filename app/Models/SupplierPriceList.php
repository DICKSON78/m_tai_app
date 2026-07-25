<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SupplierPriceList extends Model
{
    use HasFactory;

    protected $fillable = [
        'business_id', 'supplier_id', 'product_id', 'unit_price',
        'min_quantity', 'discount_percent', 'currency', 'valid_from',
        'valid_to', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'unit_price' => 'decimal:2',
            'min_quantity' => 'decimal:2',
            'discount_percent' => 'decimal:2',
            'valid_from' => 'date',
            'valid_to' => 'date',
            'is_active' => 'boolean',
        ];
    }

    public function business() { return $this->belongsTo(Business::class); }
    public function supplier() { return $this->belongsTo(Supplier::class); }
    public function product() { return $this->belongsTo(Product::class); }

    public function getIsValidAttribute()
    {
        $now = now();
        if (!$this->valid_from && !$this->valid_to) return true;
        if ($this->valid_from && $now->lt($this->valid_from)) return false;
        if ($this->valid_to && $now->gt($this->valid_to)) return false;
        return true;
    }
}
