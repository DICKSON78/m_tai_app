<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JobApplication extends Model
{
    use HasFactory;
    protected $fillable = ['job_posting_id', 'candidate_name', 'candidate_email', 'candidate_phone', 'resume_path', 'cover_letter', 'status', 'notes'];
    public function jobPosting() { return $this->belongsTo(JobPosting::class); }
}
