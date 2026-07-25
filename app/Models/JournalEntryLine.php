<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JournalEntryLine extends Model
{
    use HasFactory;

    protected $fillable = [
        'journal_entry_id', 'account_id', 'cost_center_id', 'currency_id',
        'exchange_rate', 'amount_currency', 'debit', 'credit', 'description',
    ];

    protected function casts(): array
    {
        return [
            'debit' => 'decimal:2',
            'credit' => 'decimal:2',
            'exchange_rate' => 'decimal:8',
            'amount_currency' => 'decimal:2',
        ];
    }

    public function journalEntry() { return $this->belongsTo(JournalEntry::class); }
    public function account() { return $this->belongsTo(Account::class); }
    public function costCenter() { return $this->belongsTo(CostCenter::class); }
    public function currency() { return $this->belongsTo(Currency::class); }
}
