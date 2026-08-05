<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockCount extends Model
{
    use HasFactory;

    const STATUS_DRAFT = 'draft';

    const STATUS_IN_PROGRESS = 'in_progress';

    const STATUS_COMPLETED = 'completed';

    const STATUS_APPROVED = 'approved';

    const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'business_id', 'name', 'count_date', 'status', 'counted_by',
        'total_items', 'counted_items', 'total_variance', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'count_date' => 'date',
        ];
    }

    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function countedBy()
    {
        return $this->belongsTo(User::class, 'counted_by');
    }

    public function items()
    {
        return $this->hasMany(StockCountItem::class);
    }
}
