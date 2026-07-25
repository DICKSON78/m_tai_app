<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LeaveType extends Model
{
    use HasFactory;
    protected $fillable = ['business_id', 'name', 'days_per_year', 'is_paid', 'is_active'];
    protected function casts(): array { return ['is_paid' => 'boolean', 'is_active' => 'boolean']; }
    public function business() { return $this->belongsTo(Business::class); }
    public function leaveRequests() { return $this->hasMany(LeaveRequest::class); }
}
