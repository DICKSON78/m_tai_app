<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Business extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'business_name', 'business_logo', 'business_code',
        'business_type', 'business_category', 'region', 'district',
        'ward', 'street', 'road', 'working_days', 'working_hours',
        'payment_code', 'bank_account_number', 'opening_capital',
        'status', 'is_published', 'settings', 'suspension_reason', 'verified_at',
    ];

    protected function casts(): array
    {
        return [
            'working_days' => 'array',
            'working_hours' => 'array',
            'opening_capital' => 'decimal:2',
            'is_published' => 'boolean',
            'settings' => 'array',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function capitals()
    {
        return $this->hasMany(BusinessCapital::class);
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function expenses()
    {
        return $this->hasMany(Expense::class);
    }

    public function loans()
    {
        return $this->hasMany(Loan::class);
    }

    public function employees()
    {
        return $this->hasMany(Employee::class);
    }

    public function customers()
    {
        return $this->hasMany(Customer::class);
    }

    public function deliveries()
    {
        return $this->hasMany(Delivery::class);
    }

    public function importGoods()
    {
        return $this->hasMany(ImportGood::class);
    }

    public function investments()
    {
        return $this->hasMany(Investment::class);
    }

    public function businessProjects()
    {
        return $this->hasMany(BusinessProject::class);
    }

    public function subscriptions()
    {
        return $this->hasMany(Subscription::class);
    }

    public function stockMovements()
    {
        return $this->hasMany(StockMovement::class);
    }

    public function stockBatches()
    {
        return $this->hasMany(StockBatch::class);
    }

    public function stockCounts()
    {
        return $this->hasMany(StockCount::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function creditSales()
    {
        return $this->hasMany(CreditSale::class);
    }

    public function coupons()
    {
        return $this->hasMany(Coupon::class);
    }

    public static function generateBusinessCode($district): string
    {
        $prefix = $district.'-';
        $last = static::where('business_code', 'like', $prefix.'%')
            ->latest('id')
            ->first();

        $number = $last ? intval(substr($last->business_code, -5)) + 1 : 1;

        return $prefix.str_pad($number, 5, '0', STR_PAD_LEFT);
    }
}
