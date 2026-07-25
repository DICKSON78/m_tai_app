<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HrDepartment extends Model
{
    use HasFactory;
    protected $table = 'hr_departments';
    protected $fillable = ['business_id', 'name', 'description', 'manager_id', 'is_active'];
    protected function casts(): array { return ['is_active' => 'boolean']; }
    public function business() { return $this->belongsTo(Business::class); }
    public function manager() { return $this->belongsTo(HrEmployee::class, 'manager_id'); }
    public function employees() { return $this->hasMany(HrEmployee::class, 'department_id'); }
}
