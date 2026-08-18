<?php

namespace App\Models;

use Illuminate\Database\Eloquent\BelongsTo;
use Illuminate\Database\Eloquent\HasMany;
use Illuminate\Database\Eloquent\Model;

class WarehouseZone extends Model
{
    protected $fillable = ['warehouse_id', 'name', 'code', 'description', 'capacity', 'temperature'];

    protected $casts = ['capacity' => 'decimal:2'];

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function binLocations(): HasMany
    {
        return $this->hasMany(BinLocation::class);
    }
}
