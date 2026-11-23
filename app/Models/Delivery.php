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
        'counter_price', 'counter_status', 'rejected', 'rejected_reason',
        'rejected_by', 'pickup_latitude', 'pickup_longitude', 'offered_at',
        'accepted_at', 'offer_expires_at', 'auto_dispatched',
    ];

    protected function casts(): array
    {
        return [
            'offered_price' => 'decimal:2',
            'is_negotiable' => 'boolean',
            'pickup_latitude' => 'float',
            'pickup_longitude' => 'float',
            'offered_at' => 'datetime',
            'accepted_at' => 'datetime',
            'offer_expires_at' => 'datetime',
            'auto_dispatched' => 'boolean',
        ];
    }

    public function hasActiveOffer(): bool
    {
        return $this->status === 'pending'
            && ! is_null($this->transporter_id)
            && ($this->offer_expires_at === null || $this->offer_expires_at->isFuture());
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
