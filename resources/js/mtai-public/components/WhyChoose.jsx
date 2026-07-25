const reasons = [
  {
    title: 'Built for African Markets',
    desc: 'Supports local currencies, mobile money payments, and offline-capable workflows designed for African businesses.',
    icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
    color: 'from-[#00D4AA] to-[#00B894]',
  },
  {
    title: 'Real-Time Analytics',
    desc: 'Make data-driven decisions with live dashboards showing sales trends, inventory levels, and customer insights.',
    icon: 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
    color: 'from-[#00D4AA] to-[#00B894]',
  },
  {
    title: 'Lightning Setup',
    desc: 'Go from sign-up to live in under 48 hours. We handle data migration, staff training, and provide 24/7 support.',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    color: 'from-[#00D4AA] to-[#00B894]',
  },
  {
    title: 'Trusted by 500+',
    desc: 'Join a growing community of business owners across Africa who rely on M-TAI every day.',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    color: 'from-[#00D4AA] to-[#00B894]',
  },
]

export default function WhyChoose() {
  return (
    <section className="py-24 lg:py-32 bg-white relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="inline-block text-[#00D4AA] text-xs font-bold uppercase tracking-widest mb-4 border-b-2 border-[#00D4AA]/30 pb-1">
            Why M-TAI
          </span>
          <h2 className="text-4xl lg:text-5xl font-black text-[#0A140C] tracking-tight">
            Built for Your Business
          </h2>
          <p className="text-gray-500 text-base mt-4 max-w-xl mx-auto leading-relaxed">
            A trusted partner that helps you grow your business and unlock new opportunities across Africa.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {reasons.map((item, i) => (
            <div key={i} className="group relative bg-white p-7 rounded-2xl border border-gray-100 hover:border-transparent hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-500">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon}/>
                </svg>
              </div>
              <h3 className="text-[#0A140C] font-bold text-lg mb-2">{item.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
