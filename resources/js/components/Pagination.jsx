import React from 'react';

export default function Pagination({ currentPage, lastPage, onPageChange }) {
    if (lastPage <= 1) return null;

    const pages = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(lastPage, currentPage + 2);

    if (start > 1) pages.push(1);
    if (start > 2) pages.push('...');
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < lastPage - 1) pages.push('...');
    if (end < lastPage) pages.push(lastPage);

    return (
        <div className="flex items-center justify-center gap-1.5 mt-6">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="page-btn w-9 h-9 rounded-full flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
            >
                ‹
            </button>
            {pages.map((page, i) => (
                page === '...' ? (
                    <span key={`dots-${i}`} className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm">…</span>
                ) : (
                    <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        className={`page-btn w-9 h-9 rounded-full flex items-center justify-center ${page === currentPage ? 'active' : ''}`}
                    >
                        {page}
                    </button>
                )
            ))}
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === lastPage}
                className="page-btn w-9 h-9 rounded-full flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
            >
                ›
            </button>
        </div>
    );
}
