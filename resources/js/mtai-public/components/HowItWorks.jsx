const steps = [
  {
    num: '01',
    title: 'Create Your Account',
    desc: 'Sign up in minutes with your business details. No credit card required.',
    color: '#00D4AA',
  },
  {
    num: '02',
    title: 'Set Up Your Store',
    desc: 'Add products, configure settings, and invite your team members.',
    color: '#00D4AA',
  },
  {
    num: '03',
    title: 'Start Selling',
    desc: 'Process orders, accept payments, and manage inventory from day one.',
    color: '#00D4AA',
  },
  {
    num: '04',
    title: 'Grow & Scale',
    desc: 'Access insights, expand to new markets, and grow your business.',
    color: '#00D4AA',
  },
]

export default function HowItWorks() {
  return (
    <section className="py-24 lg:py-32 bg-white relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="inline-block text-[#00D4AA] text-xs font-bold uppercase tracking-widest mb-4 border-b-2 border-[#00D4AA]/30 pb-1">
            How It Works
          </span>
          <h2 className="text-4xl lg:text-5xl font-black text-[#0A140C] tracking-tight">
            Four Simple Steps
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connector line */}
          <div className="hidden lg:block absolute top-16 left-[12.5%] right-[12.5%] h-px bg-[#00D4AA] opacity-30" />

          {steps.map((step, i) => (
            <div key={i} className="text-center relative">
              <div className="relative inline-flex mb-6">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${step.color}, ${step.color}dd)`, boxShadow: `0 8px 30px ${step.color}30` }}
                >
                  {step.num}
                </div>
              </div>
              <h3 className="text-[#0A140C] font-bold text-lg mb-2">{step.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed max-w-[240px] mx-auto">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
