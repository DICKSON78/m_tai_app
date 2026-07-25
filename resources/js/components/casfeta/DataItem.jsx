export default function DataItem({ label, value, icon, mono }) {
    return (
        <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <div className="flex items-center gap-2">
                {icon && <span className="text-[#00D4AA] text-sm">{icon}</span>}
                <p className={`text-sm font-medium text-gray-900 ${mono ? 'font-mono' : ''}`}>{value || '-'}</p>
            </div>
        </div>
    );
}
