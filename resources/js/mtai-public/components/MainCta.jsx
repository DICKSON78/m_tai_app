import { Link } from 'react-router-dom'

export default function MainCta() {
  return (
    <section className="py-24 lg:py-32 bg-[#0A140C] relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00D4AA]/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#18230F]/10 rounded-full blur-[100px]" />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.02) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-8">
          <div className="w-2 h-2 bg-[#00D4AA] rounded-full animate-pulse" />
          <span className="text-xs font-semibold text-white/70">Limited Time Offer</span>
        </div>

        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] mb-6">
          Ready to Grow Your<br />
          <span className="text-[#00D4AA]">Business?</span>
        </h2>

        <p className="text-lg text-white/40 max-w-xl mx-auto mb-10 leading-relaxed">
          Join 500+ businesses across Africa already using M-TAI to streamline operations, boost sales, and grow faster.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Link to="/register" className="px-10 py-4 bg-gradient-to-r from-[#00D4AA] to-[#00B894] text-[#0A140C] font-bold text-sm rounded-full hover:shadow-xl hover:shadow-[#00D4AA]/25 transition-all duration-300 hover:scale-105">
            Start Free Trial
          </Link>
          <Link to="/contact" className="px-10 py-4 border border-white/20 text-white font-semibold text-sm rounded-full hover:bg-white/5 hover:border-white/30 transition-all duration-300">
            Talk to Sales
          </Link>
        </div>

        <p className="text-white/30 text-xs">No credit card required · Setup in under 48 hours</p>
      </div>
    </section>
  )
}
