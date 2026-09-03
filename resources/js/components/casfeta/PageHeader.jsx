import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function PageHeader({ title, subtitle, backTo, actions, icon, iconColor = 'bg-[#00D4AA]' }) {
    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
                {icon && (
                    <div className={`h-10 w-10 ${iconColor} rounded-xl flex items-center justify-center text-white shrink-0`}>
                        {typeof icon === 'function' ? React.createElement(icon, { size: 20 }) : icon}
                    </div>
                )}
                <div>
                    <h1 className="text-xl font-bold text-gray-900">{title}</h1>
                    {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
                </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
                {backTo && (
                    <Link
                        to={backTo}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-sm font-medium transition-all duration-200"
                    >
                        <ArrowLeft size={15} />
                        Back
                    </Link>
                )}
                {actions}
            </div>
        </div>
    );
}
