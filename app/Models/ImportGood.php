<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ImportGood extends Model
{
    use HasFactory;

    protected $table = 'import_goods';

    protected $fillable = [
        'business_id', 'item_name', 'quantity', 'buying_price',
        'selling_price', 'distance_km', 'transport_cost',
        'payment_method', 'status',
    ];

    protected function casts(): array
    {
        return [
            'buying_price' => 'decimal:2',
            'selling_price' => 'decimal:2',
            'distance_km' => 'decimal:2',
            'transport_cost' => 'decimal:2',
        ];
    }

    public function business()
    {
        return $this->belongsTo(Business::class);
    }
}
