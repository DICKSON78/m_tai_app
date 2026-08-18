<?php

namespace App\Models;

use Illuminate\Database\Eloquent\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class BillOfMaterialItem extends Model
{
    protected $fillable = ['bill_of_material_id', 'product_id', 'quantity', 'unit_cost', 'notes'];

    protected $casts = ['quantity' => 'decimal:4', 'unit_cost' => 'decimal:2'];

    public function billOfMaterial(): BelongsTo
    {
        return $this->belongsTo(BillOfMaterial::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
