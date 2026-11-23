<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transporter extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'full_name', 'phone', 'vehicle_type',
        'plate_number', 'is_active', 'ratings', 'latitude',
        'longitude', 'is_online', 'last_location_at', 'region',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'is_online' => 'boolean',
            'ratings' => 'decimal:2',
            'latitude' => 'float',
            'longitude' => 'float',
            'last_location_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function deliveries()
    {
        return $this->hasMany(Delivery::class);
    }
}
