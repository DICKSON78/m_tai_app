<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HrEmployee extends Model
{
    use HasFactory;
    protected $table = 'hr_employees';
    protected $fillable = ['user_id', 'business_id', 'department_id', 'employee_number', 'first_name', 'last_name', 'email', 'phone', 'position', 'employment_type', 'hire_date', 'termination_date', 'base_salary', 'salary_type', 'bank_name', 'bank_account_number', 'emergency_contact_name', 'emergency_contact_phone', 'address', 'avatar', 'status'];
    protected function casts(): array { return ['hire_date' => 'date', 'termination_date' => 'date', 'base_salary' => 'decimal:2']; }
    public function business() { return $this->belongsTo(Business::class); }
    public function user() { return $this->belongsTo(User::class); }
    public function department() { return $this->belongsTo(HrDepartment::class, 'department_id'); }
    public function attendance() { return $this->hasMany(Attendance::class, 'employee_id'); }
    public function leaveRequests() { return $this->hasMany(LeaveRequest::class, 'employee_id'); }
    public function payrollItems() { return $this->hasMany(PayrollItem::class, 'employee_id'); }
    public function performanceReviews() { return $this->hasMany(PerformanceReview::class, 'employee_id'); }
    public function trainingEnrollments() { return $this->hasMany(TrainingEnrollment::class, 'employee_id'); }
    public function employeeBenefits() { return $this->hasMany(EmployeeBenefit::class, 'employee_id'); }
    public function getFullNameAttribute() { return $this->first_name . ' ' . $this->last_name; }
}
