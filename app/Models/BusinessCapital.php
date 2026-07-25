<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BusinessCapital extends Model
{
    use HasFactory;

    protected $fillable = [
        'business_id', 'capital_amount', 'source', 'designation',
        'registration_date',
    ];

    protected function casts(): array
    {
        return [
            'capital_amount' => 'decimal:2',
            'registration_date' => 'date',
        ];
    }

    public function business()
    {
        return $this->belongsTo(Business::class);
    }
}
