<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PayrollItem extends Model
{
    use HasFactory;
    protected $fillable = ['payroll_id', 'employee_id', 'base_salary', 'allowances', 'overtime_hours', 'overtime_rate', 'bonuses', 'tax_deduction', 'other_deductions', 'net_pay', 'status'];
    protected function casts(): array { return ['base_salary' => 'decimal:2', 'allowances' => 'decimal:2', 'overtime_hours' => 'decimal:2', 'overtime_rate' => 'decimal:2', 'bonuses' => 'decimal:2', 'tax_deduction' => 'decimal:2', 'other_deductions' => 'decimal:2', 'net_pay' => 'decimal:2']; }
    public function payroll() { return $this->belongsTo(Payroll::class); }
    public function employee() { return $this->belongsTo(HrEmployee::class, 'employee_id'); }
}
