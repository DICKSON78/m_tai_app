import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Native-app style page header for customer screens.
 * Light background blending into the page, back circle button,
 * left-aligned bold title with optional subtitle and right action slot.
 */
export default function CustomerPageHeader({ title, subtitle, onBack, rightAction }) {
    const navigate = useNavigate();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            navigate(-1);
        }
    };

    return (
        <div className="px-4 pt-3 pb-2" style={{ background: '#F8FAFC' }}>
            <div className="flex items-center gap-1 min-h-[40px]">
                <button
                    onClick={handleBack}
                    aria-label="Back"
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-opacity hover:opacity-70"
                    style={{ background: '#F1F5F9' }}
                >
                    <svg className="w-5 h-5" fill="none" stroke="#0F172A" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div className="flex-1 min-w-0 px-1">
                    <h1 className="text-[20px] font-bold leading-tight truncate" style={{ color: '#0F172A' }}>
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="text-[12px] mt-0.5 truncate" style={{ color: '#64748B' }}>
                            {subtitle}
                        </p>
                    )}
                </div>
                {rightAction && <div className="shrink-0 flex justify-end min-w-[40px]">{rightAction}</div>}
            </div>
        </div>
    );
}
