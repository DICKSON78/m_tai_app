<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TaxRate extends Model
{
    use HasFactory;
    protected $fillable = ['business_id', 'name', 'rate', 'account_id', 'is_active'];
    protected function casts(): array { return ['rate' => 'decimal:2', 'is_active' => 'boolean']; }
    public function business() { return $this->belongsTo(Business::class); }
    public function account() { return $this->belongsTo(Account::class); }
}
