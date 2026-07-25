export default function StatBox({ label, value, icon, color = 'text-[#00D4AA]' }) {
    return (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
                {icon && <span className={`${color} text-sm`}>{icon}</span>}
                <span className="text-sm text-gray-600">{label}</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">{value}</span>
        </div>
    );
}
