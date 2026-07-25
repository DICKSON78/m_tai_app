<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Supplier extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'business_id', 'name', 'code', 'contact_person', 'email', 'phone', 'secondary_phone',
        'address', 'city', 'country', 'postal_code', 'tax_number', 'registration_number',
        'payment_terms', 'credit_limit', 'outstanding_balance', 'currency', 'bank_name',
        'bank_account_number', 'bank_branch', 'notes', 'is_active', 'is_blocked', 'rating',
        'preferred_payment_method',
    ];

    protected function casts(): array
    {
        return [
            'credit_limit' => 'decimal:2',
            'outstanding_balance' => 'decimal:2',
            'rating' => 'decimal:2',
            'is_active' => 'boolean',
            'is_blocked' => 'boolean',
        ];
    }

    public function business() { return $this->belongsTo(Business::class); }
    public function purchaseOrders() { return $this->hasMany(PurchaseOrder::class); }
    public function invoices() { return $this->hasMany(SupplierInvoice::class); }
    public function payments() { return $this->hasMany(SupplierPayment::class); }
    public function priceLists() { return $this->hasMany(SupplierPriceList::class); }
    public function returns() { return $this->hasMany(PurchaseReturn::class); }

    public function getBalanceAttribute()
    {
        return $this->credit_limit - $this->outstanding_balance;
    }

    public function getDisplayNameAttribute()
    {
        return $this->code ? "{$this->code} - {$this->name}" : $this->name;
    }
}
