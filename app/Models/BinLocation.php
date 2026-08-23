<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class BinLocation extends Model
{
    protected $fillable = ['warehouse_zone_id', 'product_id', 'code', 'name', 'quantity', 'min_quantity', 'max_quantity'];

    public function zone(): BelongsTo
    {
        return $this->belongsTo(WarehouseZone::class, 'warehouse_zone_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
