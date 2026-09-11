<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmployeeBenefit extends Model
{
    use HasFactory;
    protected $fillable = ['employee_id', 'benefit_id', 'enrollment_date', 'end_date', 'status'];
    protected function casts(): array { return ['enrollment_date' => 'date:Y-m-d', 'end_date' => 'date:Y-m-d']; }
    public function employee() { return $this->belongsTo(HrEmployee::class, 'employee_id'); }
    public function benefit() { return $this->belongsTo(Benefit::class); }
}
