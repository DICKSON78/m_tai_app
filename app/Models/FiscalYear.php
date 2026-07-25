<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FiscalYear extends Model
{
    use HasFactory;
    protected $fillable = ['business_id', 'name', 'start_date', 'end_date', 'is_closed'];
    protected function casts(): array { return ['start_date' => 'date', 'end_date' => 'date', 'is_closed' => 'boolean']; }
    public function business() { return $this->belongsTo(Business::class); }
}
