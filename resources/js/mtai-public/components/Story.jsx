import { Link } from 'react-router-dom'

export default function Story() {
  return (
    <section className="py-24 lg:py-32 bg-gray-50 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#00D4AA]/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#18230F]/5 rounded-full blur-[80px]" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <div className="rounded-3xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800&h=600&fit=crop"
                alt="Business team"
                className="w-full h-96 lg:h-[480px] object-cover"
                loading="lazy"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-[#0A140C] p-6 rounded-2xl shadow-2xl hidden sm:block">
              <p className="text-[#00D4AA] text-4xl font-black">500+</p>
              <p className="text-white/60 text-xs font-medium mt-1">Businesses Served</p>
            </div>
          </div>

          <div>
            <span className="inline-block text-[#00D4AA] text-xs font-bold uppercase tracking-widest mb-4 border-b-2 border-[#00D4AA]/30 pb-1">
              Our Story
            </span>
            <h2 className="text-4xl sm:text-5xl font-black text-[#0A140C] leading-tight tracking-tight">
              Digitizing African<br />Commerce.
            </h2>
            <div className="mt-8 space-y-4 text-gray-500 text-base leading-relaxed max-w-lg">
              <p>
                We started with a simple observation: African businesses deserve world-class digital tools. Most platforms are built for Western markets and ignore the unique needs of African commerce.
              </p>
              <p>
                M-TAI was born to bridge that gap — a platform designed from the ground up for mobile money, local currencies, and the realities of doing business in Africa.
              </p>
            </div>
            <div className="mt-10 flex gap-4">
              <Link to="/about" className="px-8 py-3.5 bg-[#0A140C] text-white font-semibold text-sm rounded-full hover:bg-[#0F1A0B] transition-all duration-300">
                Learn More
              </Link>
              <Link to="/register" className="px-8 py-3.5 border border-[#0A140C]/20 text-[#0A140C] font-semibold text-sm rounded-full hover:bg-[#0A140C] hover:text-white transition-all duration-300">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
