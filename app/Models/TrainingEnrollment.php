<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TrainingEnrollment extends Model
{
    use HasFactory;
    protected $fillable = ['training_program_id', 'employee_id', 'status', 'score', 'completed_at', 'feedback'];
    protected function casts(): array { return ['completed_at' => 'datetime', 'score' => 'decimal:2']; }
    public function trainingProgram() { return $this->belongsTo(TrainingProgram::class, 'training_program_id'); }
    public function employee() { return $this->belongsTo(HrEmployee::class, 'employee_id'); }
}
