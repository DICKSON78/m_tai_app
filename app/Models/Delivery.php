<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Delivery extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'business_id', 'order_id', 'customer_id', 'goods_category',
        'item_description', 'quantity', 'pickup_location', 'destination',
        'offered_price', 'is_negotiable', 'status', 'transporter_id',
    ];

    protected function casts(): array
    {
        return [
            'offered_price' => 'decimal:2',
            'is_negotiable' => 'boolean',
        ];
    }

    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function transporter()
    {
        return $this->belongsTo(Transporter::class);
    }
}
