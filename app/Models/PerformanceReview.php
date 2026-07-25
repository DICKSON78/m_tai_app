<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PerformanceReview extends Model
{
    use HasFactory;
    protected $fillable = ['employee_id', 'reviewer_id', 'review_period_start', 'review_period_end', 'rating', 'strengths', 'areas_for_improvement', 'goals', 'comments', 'status'];
    protected function casts(): array { return ['review_period_start' => 'date', 'review_period_end' => 'date']; }
    public function employee() { return $this->belongsTo(HrEmployee::class, 'employee_id'); }
    public function reviewer() { return $this->belongsTo(HrEmployee::class, 'reviewer_id'); }
}
