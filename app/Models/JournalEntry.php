<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JournalEntry extends Model
{
    use HasFactory;

    protected $fillable = [
        'business_id', 'fiscal_period_id', 'date', 'reference', 'description',
        'journal_type', 'cost_center_id', 'is_posted', 'total_debit', 'total_credit',
        'created_by', 'is_reversed', 'reversal_of_id',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'is_posted' => 'boolean',
            'is_reversed' => 'boolean',
            'total_debit' => 'decimal:2',
            'total_credit' => 'decimal:2',
        ];
    }

    public function business() { return $this->belongsTo(Business::class); }
    public function creator() { return $this->belongsTo(User::class, 'created_by'); }
    public function lines() { return $this->hasMany(JournalEntryLine::class); }
    public function fiscalPeriod() { return $this->belongsTo(FiscalPeriod::class); }
    public function costCenter() { return $this->belongsTo(CostCenter::class); }
    public function reversalOf() { return $this->belongsTo(JournalEntry::class, 'reversal_of_id'); }
    public function reversedBy() { return $this->hasMany(JournalEntry::class, 'reversal_of_id'); }

    public function reverse($userId)
    {
        $reversal = self::create([
            'business_id' => $this->business_id,
            'date' => now()->toDateString(),
            'description' => "Reversal of: {$this->description}",
            'reference' => "REV-{$this->reference}",
            'journal_type' => 'reversal',
            'total_debit' => $this->total_debit,
            'total_credit' => $this->total_credit,
            'is_posted' => true,
            'created_by' => $userId,
            'reversal_of_id' => $this->id,
        ]);

        foreach ($this->lines as $line) {
            $reversal->lines()->create([
                'account_id' => $line->account_id,
                'debit' => $line->credit,
                'credit' => $line->debit,
                'description' => "Reversal: {$line->description}",
                'cost_center_id' => $line->cost_center_id,
            ]);
        }

        $this->update(['is_reversed' => true]);
        return $reversal;
    }
}
