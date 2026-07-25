<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExchangeRate extends Model
{
    use HasFactory;

    protected $fillable = ['business_id', 'from_currency', 'to_currency', 'rate', 'effective_date', 'is_active'];

    protected function casts(): array
    {
        return [
            'rate' => 'decimal:8',
            'effective_date' => 'date',
            'is_active' => 'boolean',
        ];
    }

    public function business() { return $this->belongsTo(Business::class); }

    public function getInverseAttribute()
    {
        return $this->rate > 0 ? 1 / $this->rate : 0;
    }
}
