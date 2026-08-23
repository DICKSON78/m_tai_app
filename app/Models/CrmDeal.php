<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class CrmDeal extends Model
{
    protected $table = 'crm_deals';

    protected $fillable = [
        'business_id', 'lead_id', 'customer_id', 'title', 'amount', 'stage',
        'expected_close_date', 'notes', 'assigned_to',
    ];

    protected $casts = ['amount' => 'decimal:2', 'expected_close_date' => 'date'];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}
