<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

class Lead extends Model
{
    protected $table = 'crm_leads';

    protected $fillable = [
        'business_id', 'name', 'email', 'phone', 'company', 'status', 'source',
        'estimated_value', 'notes', 'assigned_to', 'customer_id', 'contacted_at',
    ];

    protected $casts = [
        'estimated_value' => 'decimal:2',
        'contacted_at' => 'datetime',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function deals(): HasMany
    {
        return $this->hasMany(CrmDeal::class);
    }

    public function activities(): HasMany
    {
        return $this->hasMany(CrmActivity::class);
    }
}
