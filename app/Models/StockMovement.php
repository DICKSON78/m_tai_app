<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockMovement extends Model
{
    use HasFactory;

    protected $fillable = [
        'business_id', 'product_id', 'type', 'quantity',
        'reference_type', 'reference_id', 'notes', 'moved_by',
    ];

    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function movedBy()
    {
        return $this->belongsTo(User::class, 'moved_by');
    }
}
