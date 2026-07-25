export default function SectionHeader({ icon, title, subtitle, iconColor = 'bg-[#00D4AA]/10', iconTextColor = 'text-[#00D4AA]' }) {
    return (
        <div className="flex items-center mb-6">
            <div className={`h-10 w-10 ${iconColor} rounded-lg flex items-center justify-center mr-3 shrink-0`}>
                <span className={iconTextColor}>{icon}</span>
            </div>
            <div>
                <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
            </div>
        </div>
    );
}
