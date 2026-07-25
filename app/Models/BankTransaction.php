<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BankTransaction extends Model
{
    use HasFactory;
    protected $fillable = ['bank_account_id', 'date', 'description', 'reference', 'debit', 'credit', 'balance_after', 'is_reconciled'];
    protected function casts(): array { return ['date' => 'date', 'debit' => 'decimal:2', 'credit' => 'decimal:2', 'balance_after' => 'decimal:2', 'is_reconciled' => 'boolean']; }
    public function bankAccount() { return $this->belongsTo(BankAccount::class); }
}
