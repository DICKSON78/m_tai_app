<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Attendance extends Model
{
    use HasFactory;
    protected $fillable = ['employee_id', 'date', 'clock_in', 'clock_out', 'hours_worked', 'status', 'notes'];
    protected function casts(): array { return ['date' => 'date', 'hours_worked' => 'decimal:2']; }
    public function employee() { return $this->belongsTo(HrEmployee::class, 'employee_id'); }
}
