<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name', 'email', 'password', 'phone', 'photo', 'role',
        'location', 'street', 'road', 'age', 'user_code',
        'nida_number', 'is_active', 'is_verified', 'current_business_id',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'is_verified' => 'boolean',
            'current_business_id' => 'integer',
        ];
    }

    public function businesses()
    {
        return $this->hasMany(Business::class, 'user_id');
    }

    public function employees()
    {
        return $this->hasMany(Employee::class, 'user_id');
    }

    public function customer()
    {
        return $this->hasOne(Customer::class);
    }

    public function transporter()
    {
        return $this->hasOne(Transporter::class);
    }

    public function userNotifications()
    {
        return $this->hasMany(UserNotification::class);
    }

    public function wishlist()
    {
        return $this->hasMany(Wishlist::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public function notifications()
    {
        return $this->hasMany(UserNotification::class);
    }

    public function isAdmin()
    {
        return $this->role === 'admin';
    }

    public function isBusinessOwner()
    {
        return $this->role === 'business_owner';
    }

    public function isEmployee()
    {
        return $this->role === 'employee';
    }

    public function isCustomer()
    {
        return $this->role === 'customer';
    }

    public function isTransporter()
    {
        return $this->role === 'transporter';
    }

    public static function generateUserCode(): string
    {
        $last = static::whereNotNull('user_code')->latest('id')->first();
        $number = $last ? intval(substr($last->user_code, -6)) + 1 : 1;

        return 'CTVK-' . str_pad($number, 6, '0', STR_PAD_LEFT);
    }
}
