<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Currency extends Model
{
    use HasFactory;

    protected $fillable = ['code', 'name', 'symbol', 'decimal_places', 'is_base', 'is_active'];

    protected function casts(): array
    {
        return [
            'decimal_places' => 'integer',
            'is_base' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function exchangeRatesFrom() { return $this->hasMany(ExchangeRate::class, 'from_currency', 'code'); }
    public function exchangeRatesTo() { return $this->hasMany(ExchangeRate::class, 'to_currency', 'code'); }

    public function formatAmount($amount)
    {
        return $this->symbol . ' ' . number_format($amount, $this->decimal_places);
    }
}
