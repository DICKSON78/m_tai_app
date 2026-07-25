<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JobPosting extends Model
{
    use HasFactory;
    protected $fillable = ['business_id', 'title', 'description', 'department_id', 'employment_type', 'salary_range', 'location', 'status', 'applications_count', 'closing_date'];
    protected function casts(): array { return ['closing_date' => 'date', 'applications_count' => 'integer']; }
    public function business() { return $this->belongsTo(Business::class); }
    public function department() { return $this->belongsTo(HrDepartment::class, 'department_id'); }
    public function applications() { return $this->hasMany(JobApplication::class); }
}
