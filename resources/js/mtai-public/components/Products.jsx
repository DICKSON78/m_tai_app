import { Link } from 'react-router-dom'

const features = [
  {
    title: 'Inventory Management',
    desc: 'Track stock levels, fast-moving products, and get color-coded alerts — Red for low, Yellow for medium, Green for healthy.',
    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  },
  {
    title: 'Sales & POS',
    desc: 'Process orders with mobile money, card payments, and cash. Each transaction gets a unique TXN code for verification.',
    icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z',
  },
  {
    title: 'Profit Tracking',
    desc: 'Auto-calculates Grand Daily Sales, Grand Total Profit, Grand Daily Expenditure, and Perfect Profit with detailed reports.',
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    title: 'Loan Management',
    desc: 'Track multiple loan types — Bank, Friendly, Amana Cash — with balances, repayment plans, interest rates, and status.',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  },
  {
    title: 'Customer Credit',
    desc: 'Record credit sales (Kopsha) with customer details, due dates, reminder notifications, and debt clearance tracking.',
    icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
  },
  {
    title: 'Delivery Network',
    desc: 'Customers request delivery, transporters accept or negotiate. Track pickup, destination, pricing, and real-time status.',
    icon: 'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0',
  },
]

export default function Products() {
  return (
    <section className="py-24 lg:py-32 bg-[#0A140C] relative overflow-hidden">
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-[#00D4AA]/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#00D4AA]/5 rounded-full blur-[100px]" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <span className="inline-block text-[#00D4AA] text-xs font-bold uppercase tracking-widest mb-4 border-b-2 border-[#00D4AA]/30 pb-1">
            Features
          </span>
          <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tight max-w-2xl mx-auto">
            Everything You Need to{' '}
            <span className="text-[#00D4AA]">Run Your Business</span>
          </h2>
          <p className="text-white/40 text-base mt-4 max-w-xl mx-auto">
            From inventory to delivery, M-TAI handles every aspect of your business operations.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((item, i) => (
            <div
              key={i}
              className="group bg-white/5 border border-white/10 rounded-xl p-7 hover:border-[#00D4AA]/30 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-[#00D4AA]/10 flex items-center justify-center mb-5 group-hover:bg-[#00D4AA]/20 transition-colors">
                <svg className="w-6 h-6 text-[#00D4AA]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
              </div>
              <h3 className="text-white font-bold text-base mb-2">{item.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link to="/register" className="px-8 py-3.5 bg-gradient-to-r from-[#00D4AA] to-[#00B894] text-[#0A140C] font-bold text-sm rounded-full hover:shadow-xl hover:shadow-[#00D4AA]/25 transition-all duration-300 inline-flex items-center gap-2">
            Start Free Trial
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}
