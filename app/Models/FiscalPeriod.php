<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FiscalPeriod extends Model
{
    use HasFactory;

    protected $fillable = [
        'business_id', 'name', 'start_date', 'end_date', 'status',
        'is_adjustment', 'closed_by', 'closed_at',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'closed_at' => 'datetime',
            'is_adjustment' => 'boolean',
        ];
    }

    public function business() { return $this->belongsTo(Business::class); }
    public function journalEntries() { return $this->hasMany(JournalEntry::class); }
    public function closer() { return $this->belongsTo(User::class, 'closed_by'); }

    public function getDurationDaysAttribute()
    {
        return $this->start_date->diffInDays($this->end_date);
    }

    public function close($userId)
    {
        $this->update([
            'status' => 'closed',
            'closed_by' => $userId,
            'closed_at' => now(),
        ]);
    }
}
