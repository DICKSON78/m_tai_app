export default function HeroBanner({ icon, name, subtitle, status, statusColor = 'bg-green-500' }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-[#00D4AA] to-[#00b894] p-8">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    <div className="h-20 w-20 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                        <span className="text-white text-4xl">{icon}</span>
                    </div>
                    <div className="flex-1 text-white">
                        <h2 className="text-2xl font-bold mb-1">{name}</h2>
                        {subtitle && <p className="text-white/70 text-sm">{subtitle}</p>}
                    </div>
                    {status && (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 ${statusColor} text-white text-sm font-semibold rounded-full`}>
                            {status}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
