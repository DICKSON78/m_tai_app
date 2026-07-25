<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BillItem extends Model
{
    use HasFactory;
    protected $fillable = ['bill_id', 'description', 'quantity', 'unit_price', 'tax_rate', 'amount', 'account_id'];
    protected function casts(): array { return ['quantity' => 'decimal:2', 'unit_price' => 'decimal:2', 'tax_rate' => 'decimal:2', 'amount' => 'decimal:2']; }
    public function bill() { return $this->belongsTo(Bill::class); }
    public function account() { return $this->belongsTo(Account::class); }
}
