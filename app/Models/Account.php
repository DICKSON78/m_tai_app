<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Account extends Model
{
    use HasFactory;

    protected $fillable = [
        'business_id', 'parent_id', 'code', 'name', 'type', 'sub_type', 'description',
        'is_active', 'is_bank_account', 'is_system', 'opening_balance', 'currency',
        'sort_order', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'is_bank_account' => 'boolean',
            'is_system' => 'boolean',
            'opening_balance' => 'decimal:2',
            'sort_order' => 'integer',
        ];
    }

    public function business() { return $this->belongsTo(Business::class); }
    public function parent() { return $this->belongsTo(Account::class, 'parent_id'); }
    public function children() { return $this->hasMany(Account::class, 'parent_id'); }
    public function journalEntryLines() { return $this->hasMany(JournalEntryLine::class); }
    public function invoices() { return $this->hasMany(InvoiceItem::class); }
    public function bills() { return $this->hasMany(BillItem::class); }
    public function budgets() { return $this->hasMany(Budget::class); }

    public function getBalanceAttribute()
    {
        $debits = $this->journalEntryLines()
            ->whereHas('journalEntry', fn($q) => $q->where('is_posted', true))
            ->sum('debit');
        $credits = $this->journalEntryLines()
            ->whereHas('journalEntry', fn($q) => $q->where('is_posted', true))
            ->sum('credit');

        return $this->opening_balance + $debits - $credits;
    }

    public function getBalanceForPeriodAttribute($dateFrom, $dateTo)
    {
        $debits = $this->journalEntryLines()
            ->whereHas('journalEntry', fn($q) => $q->where('is_posted', true)->whereBetween('date', [$dateFrom, $dateTo]))
            ->sum('debit');
        $credits = $this->journalEntryLines()
            ->whereHas('journalEntry', fn($q) => $q->where('is_posted', true)->whereBetween('date', [$dateFrom, $dateTo]))
            ->sum('credit');

        return $debits - $credits;
    }

    public function getDebitBalanceAttribute()
    {
        $balance = $this->balance;
        return in_array($this->type, ['asset', 'expense']) ? max($balance, 0) : 0;
    }

    public function getCreditBalanceAttribute()
    {
        $balance = $this->balance;
        return in_array($this->type, ['liability', 'equity', 'revenue']) ? max($balance, 0) : 0;
    }
}
