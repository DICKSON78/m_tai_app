<?php

namespace App\Traits;

use App\Models\Business;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

trait BusinessOwnership
{
    protected function getBusinessId(Request $request): ?int
    {
        return $request->user()->current_business_id 
            ?? $request->user()->businesses()->first()?->id;
    }

    protected function getBusinessOrFail(Request $request): Business
    {
        $businessId = $this->getBusinessId($request);
        abort_if(!$businessId, Response::HTTP_NOT_FOUND, 'No business found');
        
        $business = Business::find($businessId);
        abort_unless($business, Response::HTTP_NOT_FOUND, 'Business not found');
        
        return $business;
    }

    protected function authorizeBusinessOwner(Business $business, Request $request): void
    {
        abort_if(
            $business->user_id !== $request->user()->id 
            && $request->user()->role !== 'admin',
            Response::HTTP_FORBIDDEN,
            'Unauthorized'
        );
    }
}
