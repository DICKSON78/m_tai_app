<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Budget extends Model
{
    use HasFactory;
    protected $fillable = ['business_id', 'account_id', 'period', 'amount', 'spent'];
    protected function casts(): array { return ['amount' => 'decimal:2', 'spent' => 'decimal:2']; }
    public function business() { return $this->belongsTo(Business::class); }
    public function account() { return $this->belongsTo(Account::class); }
    public function getPercentageAttribute() { return $this->amount > 0 ? round(($this->spent / $this->amount) * 100, 1) : 0; }
}
