<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Loan extends Model
{
    use HasFactory;

    protected $fillable = [
        'business_id', 'customer_id', 'loan_type', 'loan_amount', 'loan_balance',
        'repayment_plan', 'repayment_months', 'repayment_schedule', 'interest_rate',
        'status', 'start_date', 'due_date', 'notes', 'approved_at',
    ];

    protected function casts(): array
    {
        return [
            'loan_amount' => 'decimal:2',
            'loan_balance' => 'decimal:2',
            'interest_rate' => 'decimal:2',
            'repayment_schedule' => 'array',
            'start_date' => 'date',
            'due_date' => 'date',
        ];
    }

    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function payments()
    {
        return $this->hasMany(LoanPayment::class);
    }

    public function totalPaid(): float
    {
        return (float) $this->payments()->sum('amount');
    }
}
