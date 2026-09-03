import React from 'react';

export default function ShimmerProductGrid({ count = 8, columns = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' }) {
    return (
        <div className={`grid ${columns}`}>
            {[...Array(count)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse">
                    <div className="aspect-square bg-gray-200" />
                    <div className="p-4 space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-4 bg-gray-200 rounded w-1/2" />
                        <div className="h-8 bg-gray-200 rounded w-full" />
                    </div>
                </div>
            ))}
        </div>
    );
}