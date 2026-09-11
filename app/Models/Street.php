<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Street extends Model
{
    use HasFactory;

    protected $fillable = ['ward_id', 'name', 'is_seeded'];

    public function ward(): BelongsTo
    {
        return $this->belongsTo(Ward::class);
    }
}