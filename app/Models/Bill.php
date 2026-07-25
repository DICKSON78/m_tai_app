<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Bill extends Model
{
    use HasFactory;
    protected $fillable = ['business_id', 'vendor_name', 'bill_number', 'date', 'due_date', 'notes', 'subtotal', 'tax_amount', 'total', 'amount_paid', 'status'];
    protected function casts(): array { return ['date' => 'date', 'due_date' => 'date', 'subtotal' => 'decimal:2', 'tax_amount' => 'decimal:2', 'total' => 'decimal:2', 'amount_paid' => 'decimal:2']; }
    public function business() { return $this->belongsTo(Business::class); }
    public function items() { return $this->hasMany(BillItem::class); }
    public function getBalanceAttribute() { return $this->total - $this->amount_paid; }
}
