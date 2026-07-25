export default function InfoCard({ icon, title, subtitle, children, accent = false }) {
    return (
        <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden ${accent ? 'border-[#00D4AA]/30' : ''}`}>
            <div className="flex items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <div className="h-10 w-10 bg-[#00D4AA]/10 rounded-lg flex items-center justify-center mr-3 shrink-0">
                    <span className="text-[#00D4AA]">{icon}</span>
                </div>
                <div>
                    <h3 className="text-base font-bold text-gray-900">{title}</h3>
                    {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
                </div>
            </div>
            <div className="p-6">
                {children}
            </div>
        </div>
    );
}
