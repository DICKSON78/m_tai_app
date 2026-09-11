<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Region extends Model
{
    protected $fillable = ['name', 'is_archipelago'];

    public function districts(): HasMany
    {
        return $this->hasMany(District::class);
    }
}