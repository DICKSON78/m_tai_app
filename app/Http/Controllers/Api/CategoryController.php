<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function index(Request $request, Business $business)
    {
        if ($business->user_id !== $request->user()->id) {
            abort(403, 'Huna ruhusa');
        }

        $categories = Category::with(['children:id,name,slug,parent_id'])
            ->where('business_id', $business->id)
            ->whereNull('parent_id')
            ->withCount('products')
            ->orderBy('name')
            ->get();

        return response()->json($categories);
    }

    public function store(Request $request, Business $business)
    {
        if ($business->user_id !== $request->user()->id) {
            abort(403, 'Huna ruhusa');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|integer|exists:categories,id',
            'description' => 'nullable|string|max:1000',
        ]);

        // Ensure parent belongs to the same business
        if (!empty($validated['parent_id'])) {
            $parent = Category::find($validated['parent_id']);
            if (!$parent || $parent->business_id !== $business->id) {
                return response()->json(['message' => 'Kategoria mzazi si sahihi.'], 422);
            }
        }

        $validated['business_id'] = $business->id;
        $validated['slug'] = Str::slug($validated['name']) . '-' . Str::random(5);
        $category = Category::create($validated);

        return response()->json($category, 201);
    }

    public function show(Request $request, Category $category)
    {
        $business = $category->business;

        if ($business->user_id !== $request->user()->id) {
            abort(403, 'Huna ruhusa');
        }

        $category->load(['children']);
        $category->loadCount('products');

        return response()->json($category);
    }

    public function update(Request $request, Category $category)
    {
        $business = $category->business;

        if ($business->user_id !== $request->user()->id) {
            abort(403, 'Huna ruhusa');
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'parent_id' => 'nullable|exists:categories,id',
            'description' => 'nullable|string|max:1000',
        ]);

        // Prevent circular reference
        if (isset($validated['parent_id'])) {
            if ((int) $validated['parent_id'] === $category->id) {
                return response()->json(['message' => 'Kategoria haiwezi kuwa mzazi wake wenyewe.'], 422);
            }
            // Check that new parent belongs to same business
            $parent = Category::find($validated['parent_id']);
            if (!$parent || $parent->business_id !== $business->id) {
                return response()->json(['message' => 'Kategoria mzazi si sahihi.'], 422);
            }
        }

        $category->update($validated);

        return response()->json($category);
    }

    public function destroy(Request $request, Category $category)
    {
        $business = $category->business;

        if ($business->user_id !== $request->user()->id) {
            abort(403, 'Huna ruhusa');
        }

        if ($category->products()->count() > 0) {
            return response()->json(['message' => 'Haiwezi kufuta kategoria iliyo na bidhaa.'], 422);
        }

        if ($category->children()->count() > 0) {
            return response()->json(['message' => 'Haiwezi kufuta kategoria iliyo na vijana; futa vijana kwanza.'], 422);
        }

        $category->delete();

        return response()->json(['message' => 'Kategoria imefutwa.']);
    }

    public function tree(Request $request, Business $business)
    {
        if ($business->user_id !== $request->user()->id) {
            abort(403, 'Huna ruhusa');
        }

        $categories = Category::with(['children.children'])
            ->where('business_id', $business->id)
            ->whereNull('parent_id')
            ->withCount(['products'])
            ->orderBy('name')
            ->get();

        return response()->json($categories);
    }
}
