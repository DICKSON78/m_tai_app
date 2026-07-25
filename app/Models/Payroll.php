<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payroll extends Model
{
    use HasFactory;
    protected $fillable = ['business_id', 'name', 'period_start', 'period_end', 'payment_date', 'status', 'total_gross', 'total_deductions', 'total_net', 'processed_by'];
    protected function casts(): array { return ['period_start' => 'date', 'period_end' => 'date', 'payment_date' => 'date', 'total_gross' => 'decimal:2', 'total_deductions' => 'decimal:2', 'total_net' => 'decimal:2']; }
    public function business() { return $this->belongsTo(Business::class); }
    public function processor() { return $this->belongsTo(User::class, 'processed_by'); }
    public function items() { return $this->hasMany(PayrollItem::class); }
}
