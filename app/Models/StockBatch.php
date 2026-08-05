<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockBatch extends Model
{
    use HasFactory;

    protected $fillable = [
        'business_id', 'product_id', 'batch_number', 'quantity',
        'manufacturing_date', 'expiry_date', 'supplier_id', 'received_at',
        'received_by', 'warehouse_location', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'manufacturing_date' => 'date',
            'expiry_date' => 'date',
            'received_at' => 'date',
        ];
    }

    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function receiver()
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    public function movements()
    {
        return $this->hasMany(StockMovement::class);
    }

    public function getExpiryStatusAttribute()
    {
        if (! $this->expiry_date) {
            return 'no_expiry';
        }
        $days = now()->startOfDay()->diffInDays($this->expiry_date->startOfDay(), false);
        if ($days < 0) {
            return 'expired';
        }
        if ($days <= 30) {
            return 'expiring_soon';
        }

        return 'ok';
    }
}
