<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Benefit extends Model
{
    use HasFactory;
    protected $fillable = ['business_id', 'name', 'description', 'provider', 'cost_per_employee', 'type', 'is_active'];
    protected function casts(): array { return ['cost_per_employee' => 'decimal:2', 'is_active' => 'boolean']; }
    public function business() { return $this->belongsTo(Business::class); }
    public function employeeBenefits() { return $this->hasMany(EmployeeBenefit::class); }
}
