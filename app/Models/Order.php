<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'business_id', 'customer_id', 'transaction_code', 'subtotal',
        'discount', 'tax', 'total', 'status', 'payment_status',
        'notes', 'processed_by', 'currency_id', 'currency_code', 'exchange_rate',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'discount' => 'decimal:2',
            'tax' => 'decimal:2',
            'total' => 'decimal:2',
        ];
    }

    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function currency()
    {
        return $this->belongsTo(Currency::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function processor()
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    public function delivery()
    {
        return $this->hasOne(Delivery::class);
    }

    public static function generateTransactionCode(): string
    {
        $year = date('Y');
        $prefix = 'TXN-' . $year;

        $last = static::where('transaction_code', 'like', $prefix . '%')
            ->latest('id')
            ->first();

        $number = $last ? intval(substr($last->transaction_code, -5)) + 1 : 1;

        return $prefix . str_pad($number, 5, '0', STR_PAD_LEFT);
    }
}
