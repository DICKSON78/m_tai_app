import { Inbox, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EmptyState({ title = 'No data yet', description, actionTo, actionLabel = 'Add New' }) {
    return (
        <div className="text-center py-12 px-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Inbox size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
            {description && <p className="text-sm text-gray-500 mb-4">{description}</p>}
            {actionTo && (
                <Link
                    to={actionTo}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00D4AA] text-white font-medium rounded-lg hover:bg-[#00B894] transition-all duration-200 text-sm"
                >
                    <Plus size={16} />
                    {actionLabel}
                </Link>
            )}
        </div>
    );
}
