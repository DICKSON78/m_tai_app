<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Models\Product;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function index(Request $request, Product $product)
    {
        $reviews = $product->reviews()
            ->with('user:id,name')
            ->where('is_approved', true)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        $avgRating = $product->reviews()->where('is_approved', true)->avg('rating');
        $totalReviews = $product->reviews()->where('is_approved', true)->count();

        return response()->json([
            'reviews' => $reviews,
            'average_rating' => round($avgRating ?? 0, 1),
            'total_reviews' => $totalReviews,
        ]);
    }

    public function store(Request $request, Product $product)
    {
        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
            'order_id' => 'nullable|exists:orders,id',
        ]);

        $existing = Review::where('product_id', $product->id)
            ->where('user_id', $request->user()->id)
            ->first();

        if ($existing) {
            return response()->json(['message' => 'Tayari umetoa maoni kwa bidhaa hii.'], 422);
        }

        $review = Review::create([
            'product_id' => $product->id,
            'user_id' => $request->user()->id,
            'order_id' => $validated['order_id'] ?? null,
            'rating' => $validated['rating'],
            'comment' => $validated['comment'] ?? null,
            'is_approved' => true,
        ]);

        return response()->json([
            'message' => 'Maoni yameandikwa.',
            'review' => $review->load('user:id,name'),
        ], 201);
    }

    public function update(Request $request, Review $review)
    {
        if ($review->user_id !== $request->user()->id) {
            abort(403, 'Huna ruhusa ya kusasisha maoni haya.');
        }

        $validated = $request->validate([
            'rating' => 'sometimes|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $review->update($validated);

        return response()->json([
            'message' => 'Maoni yamesasishwa.',
            'review' => $review->fresh()->load('user:id,name'),
        ]);
    }

    public function destroy(Request $request, Review $review)
    {
        if ($review->user_id !== $request->user()->id) {
            abort(403, 'Huna ruhusa ya kufuta maoni haya.');
        }

        $review->delete();

        return response()->json(['message' => 'Maoni yamefutwa.']);
    }
}
