const team = [
  { name: 'James Mwangi', role: 'Founder & CEO', initials: 'JM', color: 'from-[#00D4AA] to-[#00B894]' },
  { name: 'Sarah Kimani', role: 'Head of Product', initials: 'SK', color: 'from-[#18230F] to-[#1E3A1A]' },
  { name: 'David Ochieng', role: 'CTO', initials: 'DO', color: 'from-[#2D5A3D] to-[#1E3A1A]' },
  { name: 'Amina Hassan', role: 'Head of Operations', initials: 'AH', color: 'from-[#D4A853] to-[#B8922E]' },
]

const values = [
  {
    title: 'Built for Africa',
    desc: 'We design for the realities of African commerce — from mobile money to offline-first workflows.',
    icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
  },
  {
    title: 'Customer First',
    desc: 'Every feature starts with a conversation with our customers. Their success is our success.',
    icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  },
  {
    title: 'Security & Trust',
    desc: 'Enterprise-grade security protects your data. We earn your trust every day.',
    icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  },
]

const stats = [
  { value: '500+', label: 'Businesses Served' },
  { value: '15+', label: 'Countries' },
  { value: '50M+', label: 'Transactions Processed' },
  { value: '99.9%', label: 'Uptime' },
]

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-[#0A140C] py-32 lg:py-40 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00D4AA]/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#18230F]/10 rounded-full blur-[100px]" />
        </div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <span className="inline-block px-4 py-1.5 bg-white/5 border border-white/10 text-[#00D4AA] text-xs font-bold uppercase tracking-widest rounded-full mb-6">
            About Us
          </span>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.05] mb-6">
            Digitizing<br />
            <span className="text-[#00D4AA]">African Commerce</span>
          </h1>
          <p className="text-lg text-white/40 max-w-xl mx-auto leading-relaxed">
            M-TAI was born from a simple belief: African businesses deserve world-class digital tools, built for the way they actually work.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-4xl font-black text-[#0A140C]">{s.value}</p>
                <p className="text-gray-400 text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Our team"
                  className="w-full h-96 lg:h-[480px] object-cover"
                  loading="lazy"
                />
              </div>
            </div>
            <div>
              <span className="inline-block text-[#00D4AA] text-xs font-bold uppercase tracking-widest mb-4 border-b-2 border-[#00D4AA]/30 pb-1">
                Our Story
              </span>
              <h2 className="text-4xl font-black text-[#0A140C] tracking-tight mb-6">
                From Idea to Impact
              </h2>
              <div className="space-y-4 text-gray-500 text-base leading-relaxed">
                <p>
                  M-TAI started in 2024 when our founder, James Mwangi, watched his mother struggle with managing her shop using paper records and spreadsheets. She was losing track of inventory, missing sales opportunities, and spending hours on manual bookkeeping.
                </p>
                <p>
                  We realized millions of small business owners across Africa face the same challenges daily. Existing solutions were either too expensive, too complex, or built for Western markets without understanding the realities of African commerce.
                </p>
                <p>
                  Today, M-TAI serves 500+ businesses across 15+ countries, processing over 50 million transactions. We're just getting started.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 lg:py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block text-[#00D4AA] text-xs font-bold uppercase tracking-widest mb-4 border-b-2 border-[#00D4AA]/30 pb-1">
              Our Values
            </span>
            <h2 className="text-4xl font-black text-[#0A140C] tracking-tight">What Drives Us</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {values.map((v, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-[#00D4AA]/10 flex items-center justify-center mb-6">
                  <svg className="w-7 h-7 text-[#00D4AA]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={v.icon}/>
                  </svg>
                </div>
                <h3 className="text-[#0A140C] font-bold text-lg mb-2">{v.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block text-[#00D4AA] text-xs font-bold uppercase tracking-widest mb-4 border-b-2 border-[#00D4AA]/30 pb-1">
              Our Team
            </span>
            <h2 className="text-4xl font-black text-[#0A140C] tracking-tight">Meet the People Behind M-TAI</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((t, i) => (
              <div key={i} className="text-center group">
                <div className={`w-28 h-28 mx-auto rounded-3xl bg-gradient-to-br ${t.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <span className="text-white text-2xl font-black">{t.initials}</span>
                </div>
                <h3 className="text-[#0A140C] font-bold text-base">{t.name}</h3>
                <p className="text-gray-400 text-sm mt-1">{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
