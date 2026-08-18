<?php

namespace App\Models;

use Illuminate\Database\Eloquent\BelongsTo;
use Illuminate\Database\Eloquent\HasMany;
use Illuminate\Database\Eloquent\Model;

class Warehouse extends Model
{
    protected $fillable = [
        'business_id', 'name', 'code', 'address', 'city', 'phone',
        'manager_name', 'total_capacity', 'status',
    ];

    protected $casts = ['total_capacity' => 'decimal:2'];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function zones(): HasMany
    {
        return $this->hasMany(WarehouseZone::class);
    }

    public function binLocations(): HasMany
    {
        return $this->hasManyThrough(BinLocation::class, WarehouseZone::class);
    }
}
