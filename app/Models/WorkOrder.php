<?php

namespace App\Models;

use Illuminate\Database\Eloquent\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class WorkOrder extends Model
{
    protected $fillable = [
        'business_id', 'bill_of_material_id', 'order_number', 'product_name',
        'quantity_planned', 'quantity_completed', 'quantity_scrapped', 'status',
        'planned_start', 'planned_end', 'actual_start', 'actual_end',
        'estimated_cost', 'actual_cost', 'notes',
    ];

    protected $casts = [
        'estimated_cost' => 'decimal:2', 'actual_cost' => 'decimal:2',
        'planned_start' => 'date', 'planned_end' => 'date',
        'actual_start' => 'date', 'actual_end' => 'date',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function billOfMaterial(): BelongsTo
    {
        return $this->belongsTo(BillOfMaterial::class);
    }
}
