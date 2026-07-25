import React from 'react';

export default function StatsCard({ title, value, icon, color = 'primary', subtitle }) {
    const colors = {
        primary: { bg: 'bg-primary-light', text: 'text-primary-dark' },
        success: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
        warning: { bg: 'bg-amber-50', text: 'text-amber-600' },
        danger: { bg: 'bg-red-50', text: 'text-red-600' },
        info: { bg: 'bg-blue-50', text: 'text-blue-600' },
        gold: { bg: 'bg-yellow-50', text: 'text-yellow-600' },
    };

    const c = colors[color] || colors.primary;

    return (
        <div className="stat-card group">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{title}</p>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                    {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
                </div>
                {icon && (
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${c.bg} ${c.text} group-hover:scale-110 transition-transform duration-300`}>
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
}
