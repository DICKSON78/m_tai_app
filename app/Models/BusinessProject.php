<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class BusinessProject extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'business_projects';

    protected $fillable = [
        'business_id', 'project_name', 'required_capital', 'timeline_months',
        'completion_date', 'recommended_loan_amount', 'savings_plan',
        'allocation', 'status', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'required_capital' => 'decimal:2',
            'completion_date' => 'date',
            'recommended_loan_amount' => 'decimal:2',
            'savings_plan' => 'array',
            'allocation' => 'array',
        ];
    }

    public function business()
    {
        return $this->belongsTo(Business::class);
    }
}
