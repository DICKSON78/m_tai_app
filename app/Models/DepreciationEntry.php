<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DepreciationEntry extends Model
{
    use HasFactory;

    protected $fillable = [
        'business_id', 'fixed_asset_id', 'journal_entry_id', 'depreciation_date',
        'amount', 'accumulated_total', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'depreciation_date' => 'date',
            'amount' => 'decimal:2',
            'accumulated_total' => 'decimal:2',
        ];
    }

    public function business() { return $this->belongsTo(Business::class); }
    public function fixedAsset() { return $this->belongsTo(FixedAsset::class); }
    public function journalEntry() { return $this->belongsTo(JournalEntry::class); }
}
