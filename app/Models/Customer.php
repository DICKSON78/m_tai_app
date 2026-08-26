<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id', 'business_id', 'customer_code', 'full_name',
        'phone', 'location', 'street', 'road', 'is_guest',
    ];

    protected function casts(): array
    {
        return [
            'is_guest' => 'boolean',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function creditSales()
    {
        return $this->hasMany(CreditSale::class);
    }

    public function deliveries()
    {
        return $this->hasMany(Delivery::class);
    }

    public function loans()
    {
        return $this->hasMany(Loan::class);
    }

    public static function generateCustomerCode(): string
    {
        $prefix = 'CTM-';
        $last = static::where('customer_code', 'like', $prefix . '%')
            ->latest('id')
            ->first();
        $number = $last ? intval(substr($last->customer_code, 4)) + 1 : 1;
        return $prefix . str_pad($number, 6, '0', STR_PAD_LEFT);
    }
}
