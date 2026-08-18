<?php

namespace App\Models;

use Illuminate\Database\Eloquent\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class CrmCampaign extends Model
{
    protected $table = 'crm_campaigns';

    protected $fillable = [
        'business_id', 'name', 'description', 'type', 'status', 'budget', 'spent',
        'leads_generated', 'conversions', 'start_date', 'end_date',
    ];

    protected $casts = [
        'budget' => 'decimal:2', 'spent' => 'decimal:2',
        'start_date' => 'date', 'end_date' => 'date',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }
}
