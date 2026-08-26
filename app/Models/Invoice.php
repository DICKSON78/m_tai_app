<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use HasFactory;
    protected $fillable = ['business_id', 'customer_id', 'invoice_number', 'date', 'due_date', 'notes', 'subtotal', 'tax_amount', 'discount_amount', 'total', 'amount_paid', 'status', 'currency_id', 'currency_code', 'exchange_rate'];
    protected function casts(): array { return ['date' => 'date', 'due_date' => 'date', 'subtotal' => 'decimal:2', 'tax_amount' => 'decimal:2', 'discount_amount' => 'decimal:2', 'total' => 'decimal:2', 'amount_paid' => 'decimal:2']; }
    public function business() { return $this->belongsTo(Business::class); }
    public function currency() { return $this->belongsTo(Currency::class); }
    public function customer() { return $this->belongsTo(Customer::class); }
    public function items() { return $this->hasMany(InvoiceItem::class); }
    public function getBalanceAttribute() { return $this->total - $this->amount_paid; }
}
