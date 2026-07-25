<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BankAccount extends Model
{
    use HasFactory;
    protected $fillable = ['business_id', 'account_id', 'bank_name', 'account_name', 'account_number', 'sort_code', 'balance', 'is_active'];
    protected function casts(): array { return ['balance' => 'decimal:2', 'is_active' => 'boolean']; }
    public function business() { return $this->belongsTo(Business::class); }
    public function account() { return $this->belongsTo(Account::class); }
    public function transactions() { return $this->hasMany(BankTransaction::class); }
}
