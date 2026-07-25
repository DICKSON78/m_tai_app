<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class FixedAsset extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'business_id', 'asset_code', 'name', 'description', 'category_account_id',
        'depreciation_account_id', 'purchase_date', 'purchase_price', 'salvage_value',
        'useful_life_months', 'depreciation_method', 'accumulated_depreciation',
        'current_value', 'status', 'disposal_date', 'disposal_price',
        'location_id', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'purchase_date' => 'date',
            'disposal_date' => 'date',
            'purchase_price' => 'decimal:2',
            'salvage_value' => 'decimal:2',
            'accumulated_depreciation' => 'decimal:2',
            'current_value' => 'decimal:2',
            'disposal_price' => 'decimal:2',
            'useful_life_months' => 'integer',
        ];
    }

    public function business() { return $this->belongsTo(Business::class); }
    public function categoryAccount() { return $this->belongsTo(Account::class, 'category_account_id'); }
    public function depreciationAccount() { return $this->belongsTo(Account::class, 'depreciation_account_id'); }
    public function location() { return $this->belongsTo(CostCenter::class, 'location_id'); }
    public function depreciationEntries() { return $this->hasMany(DepreciationEntry::class); }

    public function getMonthlyDepreciationAttribute()
    {
        $depreciable = $this->purchase_price - $this->salvage_value;
        return $this->useful_life_months > 0 ? $depreciable / $this->useful_life_months : 0;
    }

    public function getNetBookValueAttribute()
    {
        return $this->purchase_price - $this->accumulated_depreciation;
    }

    public function getDepreciationPercentAttribute()
    {
        return $this->purchase_price > 0 ? round(($this->accumulated_depreciation / $this->purchase_price) * 100, 1) : 0;
    }
}
