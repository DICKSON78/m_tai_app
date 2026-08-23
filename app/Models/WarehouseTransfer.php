<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class WarehouseTransfer extends Model
{
    protected $fillable = [
        'business_id', 'product_id', 'from_warehouse_id', 'to_warehouse_id',
        'from_bin_location_id', 'to_bin_location_id', 'reference_number',
        'quantity', 'status', 'notes', 'transfer_date', 'received_date', 'stock_movement_id',
    ];

    protected $casts = ['transfer_date' => 'date', 'received_date' => 'date'];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function fromWarehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'from_warehouse_id');
    }

    public function toWarehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'to_warehouse_id');
    }

    public function fromBin(): BelongsTo
    {
        return $this->belongsTo(BinLocation::class, 'from_bin_location_id');
    }

    public function toBin(): BelongsTo
    {
        return $this->belongsTo(BinLocation::class, 'to_bin_location_id');
    }
}
