<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CostCenter extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['business_id', 'code', 'name', 'description', 'parent_id', 'budget_amount', 'is_active'];

    protected function casts(): array
    {
        return [
            'budget_amount' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function business() { return $this->belongsTo(Business::class); }
    public function parent() { return $this->belongsTo(CostCenter::class, 'parent_id'); }
    public function children() { return $this->hasMany(CostCenter::class, 'parent_id'); }
    public function journalEntryLines() { return $this->hasMany(JournalEntryLine::class); }

    public function getSpentAmountAttribute()
    {
        return $this->journalEntryLines()
            ->whereHas('journalEntry', fn($q) => $q->where('is_posted', true))
            ->sum('debit');
    }

    public function getRemainingBudgetAttribute()
    {
        return $this->budget_amount - $this->spent_amount;
    }

    public function getBudgetUsagePercentAttribute()
    {
        return $this->budget_amount > 0 ? round(($this->spent_amount / $this->budget_amount) * 100, 1) : 0;
    }
}
