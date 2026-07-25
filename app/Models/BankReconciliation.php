<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BankReconciliation extends Model
{
    use HasFactory;

    protected $fillable = [
        'business_id', 'bank_account_id', 'reconciliation_date',
        'statement_balance', 'book_balance', 'difference', 'status',
        'notes', 'reconciled_by',
    ];

    protected function casts(): array
    {
        return [
            'reconciliation_date' => 'date',
            'statement_balance' => 'decimal:2',
            'book_balance' => 'decimal:2',
            'difference' => 'decimal:2',
        ];
    }

    public function business() { return $this->belongsTo(Business::class); }
    public function bankAccount() { return $this->belongsTo(BankAccount::class); }
    public function reconciler() { return $this->belongsTo(User::class, 'reconciled_by'); }
}
