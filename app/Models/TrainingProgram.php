<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TrainingProgram extends Model
{
    use HasFactory;
    protected $fillable = ['business_id', 'title', 'description', 'instructor', 'duration_hours', 'start_date', 'end_date', 'max_participants', 'cost', 'status'];
    protected function casts(): array { return ['start_date' => 'date', 'end_date' => 'date', 'cost' => 'decimal:2', 'duration_hours' => 'integer', 'max_participants' => 'integer']; }
    public function business() { return $this->belongsTo(Business::class); }
    public function enrollments() { return $this->hasMany(TrainingEnrollment::class, 'training_program_id'); }
}
