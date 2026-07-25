<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CreditSale extends Model
{
    use HasFactory;

    protected $table = 'credit_sales';

    protected $fillable = [
        'business_id', 'customer_name', 'customer_phone', 'product_name',
        'quantity', 'amount', 'due_date', 'status', 'amount_paid', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'amount_paid' => 'decimal:2',
            'due_date' => 'date',
        ];
    }

    public function business()
    {
        return $this->belongsTo(Business::class);
    }
}
