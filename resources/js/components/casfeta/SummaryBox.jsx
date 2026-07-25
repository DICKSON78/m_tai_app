export default function SummaryBox({ icon, label, value, color = 'text-[#00D4AA]' }) {
    return (
        <div className="bg-[#00D4AA]/5 border-2 border-[#00D4AA]/20 p-4 rounded-lg">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    {icon && <span className={`${color}`}>{icon}</span>}
                    <span className="font-medium text-gray-900 text-sm">{label}</span>
                </div>
                <span className={`text-lg font-bold ${color}`}>{value}</span>
            </div>
        </div>
    );
}
