<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected $appends = ['price', 'compare_at_price'];

    protected $fillable = [
        'business_id', 'category_id', 'name', 'slug', 'sku', 'barcode', 'description',
        'image', 'video', 'buying_price', 'selling_price', 'wholesale_price',
        'retail_price', 'quantity', 'unit', 'low_stock_threshold', 'reorder_quantity',
        'is_track_stock', 'location', 'is_published', 'is_draft',
    ];

    protected function casts(): array
    {
        return [
            'buying_price' => 'decimal:2',
            'selling_price' => 'decimal:2',
            'wholesale_price' => 'decimal:2',
            'retail_price' => 'decimal:2',
            'quantity' => 'integer',
            'low_stock_threshold' => 'integer',
            'reorder_quantity' => 'integer',
            'is_track_stock' => 'boolean',
            'is_published' => 'boolean',
            'is_draft' => 'boolean',
        ];
    }

    public function business()
    {
        return $this->belongsTo(Business::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function stockMovements()
    {
        return $this->hasMany(StockMovement::class);
    }

    public function stockBatches()
    {
        return $this->hasMany(StockBatch::class);
    }

    public function getStockLevelAttribute()
    {
        if ($this->quantity <= 0) {
            return 'out_of_stock';
        }
        $threshold = max(1, (int) $this->low_stock_threshold);
        if ($this->quantity <= $threshold) {
            return 'low';
        }
        if ($this->quantity <= $threshold * 3) {
            return 'medium';
        }

        return 'healthy';
    }

    public function getPriceAttribute()
    {
        if ($this->selling_price > 0) {
            return (float) $this->selling_price;
        }
        if ((float) $this->retail_price > 0) {
            return (float) $this->retail_price;
        }

        return (float) $this->selling_price;
    }

    public function getCompareAtPriceAttribute()
    {
        $price = $this->price;
        $wholesale = (float) $this->wholesale_price;

        return $wholesale > $price ? $wholesale : null;
    }

    public function getStockValueCostAttribute()
    {
        return $this->quantity * (float) $this->buying_price;
    }

    public function getStockValueRetailAttribute()
    {
        return $this->quantity * (float) $this->selling_price;
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public function images()
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
    }

    public function primaryImage()
    {
        return $this->hasOne(ProductImage::class)->where('is_primary', true);
    }

    public function variants()
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function averageRating()
    {
        return $this->reviews()->where('is_approved', true)->avg('rating');
    }

    public function reviewsCount()
    {
        return $this->reviews()->where('is_approved', true)->count();
    }
}
