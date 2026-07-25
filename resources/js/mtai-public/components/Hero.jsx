import { Link } from 'react-router-dom'

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[#0A140C]">
      {/* Minimal background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00D4AA]/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#00D4AA]/3 rounded-full blur-[80px]" />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)', backgroundSize: '48px 48px' }} />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-24 lg:py-32 relative z-10 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Content */}
          <div className="slide-in-left">
            {/* Badge */}
            <div className="fade-in-up mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
                <div className="w-2 h-2 bg-[#00D4AA] rounded-full" />
                <span className="text-xs font-semibold text-white/70">Now serving 500+ businesses across Africa</span>
              </div>
            </div>

            {/* Heading */}
            <div className="fade-in-up-d1 mb-6">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight">
                Run Your<br />
                Business<br />
                <span className="text-[#00D4AA]">Smarter.</span>
              </h1>
            </div>

            {/* Description */}
            <div className="fade-in-up-d2 mb-10">
              <p className="text-lg text-white/50 max-w-md leading-relaxed">
                The all-in-one platform for inventory, sales, customers, and analytics. Built for African businesses, designed for the world.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 fade-in-up-d3 mb-12">
              <Link
                to="/register"
                className="px-8 py-4 bg-gradient-to-r from-[#00D4AA] to-[#00B894] text-[#0A140C] font-bold text-sm rounded-full hover:shadow-xl hover:shadow-[#00D4AA]/25 transition-all duration-300 text-center"
              >
                Start Free Trial
              </Link>
              <Link
                to="/products"
                className="px-8 py-4 border border-white/20 text-white font-semibold text-sm rounded-full hover:bg-white/5 transition-all duration-300 text-center"
              >
                See How It Works
              </Link>
            </div>

            {/* Trust */}
            <div className="grid grid-cols-[auto_1fr] items-center gap-6 fade-in-up-d4">
              <div className="flex -space-x-3">
                {['AK', 'JM', 'SM', 'NK'].map((initials, i) => (
                  <div key={i} className={`relative w-10 h-10 rounded-full bg-gradient-to-br ${i === 0 ? 'from-[#00D4AA] to-[#00B894]' : 'from-[#2D5A3D] to-[#1E3A1A]'} border-2 border-[#0A140C] flex items-center justify-center`}>
                    <span className="text-white text-xs font-bold">{initials}</span>
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1 mb-0.5">
                  {[1,2,3,4,5].map(i => (
                    <svg key={i} className="w-4 h-4 text-[#D4A853]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-white/40 text-xs">Trusted by 500+ businesses</p>
              </div>
            </div>
          </div>

          {/* Right - 4 Images Grid */}
          <div className="hidden lg:block relative slide-in-right">
            <div className="relative grid grid-cols-2 gap-4">
              {[
                { img: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=300&fit=crop', title: 'Inventory', desc: 'Track stock in real-time', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
                { img: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop', title: 'Point of Sale', desc: 'Fast checkout system', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
                { img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop', title: 'Analytics', desc: 'Smart business insights', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
                { img: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=300&fit=crop', title: 'Team', desc: 'Manage your staff', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
              ].map((item, i) => (
                <div key={i} className={`relative group overflow-hidden rounded-2xl border border-white/10 hover:border-[#00D4AA]/30 transition-all duration-500 ${i % 2 === 1 ? 'mt-8' : ''} fade-in-up`}>
                  <img
                    src={item.img}
                    alt={item.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A140C] via-[#0A140C]/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 bg-[#00D4AA]/20 rounded-md flex items-center justify-center">
                        <svg className="w-3 h-3 text-[#00D4AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                        </svg>
                      </div>
                      <span className="text-white text-sm font-bold">{item.title}</span>
                    </div>
                    <p className="text-white/50 text-xs">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
