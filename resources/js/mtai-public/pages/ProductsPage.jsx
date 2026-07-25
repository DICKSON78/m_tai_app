import { Link } from 'react-router-dom'

const products = [
  {
    name: 'Inventory Management',
    desc: 'Track stock levels, set reorder points, manage expiration dates, and get real-time alerts across all locations.',
    features: ['Real-time stock tracking', 'Low-stock alerts', 'Expiration date management', 'Multi-location support'],
    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    color: 'from-[#00D4AA] to-[#00B894]',
    img: 'https://images.pexels.com/photos/4481326/pexels-photo-4481326.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    name: 'Point of Sale',
    desc: 'Process transactions quickly with integrated mobile money, card payments, and instant invoicing.',
    features: ['Mobile money integration', 'Card payments', 'Instant invoicing', 'Receipt generation'],
    icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z',
    color: 'from-[#18230F] to-[#1E3A1A]',
    img: 'https://images.pexels.com/photos/3760067/pexels-photo-3760067.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    name: 'Customer Management',
    desc: 'Build lasting relationships with customer profiles, purchase history, and loyalty programs.',
    features: ['Customer profiles', 'Purchase history', 'Loyalty programs', 'Communication tools'],
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    color: 'from-[#2D5A3D] to-[#1E3A1A]',
    img: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    name: 'Analytics & Reports',
    desc: 'Make data-driven decisions with live dashboards showing sales trends, inventory levels, and customer insights.',
    features: ['Real-time dashboards', 'Sales analytics', 'Inventory reports', 'Export capabilities'],
    icon: 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
    color: 'from-[#D4A853] to-[#B8922E]',
    img: 'https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    name: 'Employee Management',
    desc: 'Manage your team with role-based access, shift scheduling, and performance tracking.',
    features: ['Role-based access', 'Shift scheduling', 'Performance tracking', 'Payroll integration'],
    icon: 'M12 4.354a4 4 0 110 7.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z',
    color: 'from-[#4A7C3F] to-[#2D5A3D]',
    img: 'https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    name: 'Delivery & Transport',
    desc: 'Manage deliveries, track shipments, and coordinate your transport network efficiently.',
    features: ['Delivery tracking', 'Route optimization', 'Transporter management', 'Proof of delivery'],
    icon: 'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0',
    color: 'from-[#00D4AA] to-[#00B894]',
    img: 'https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
]

export default function ProductsPage() {
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
            Products
          </span>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.05] mb-6">
            Everything You Need<br />
            <span className="text-[#00D4AA]">to Scale</span>
          </h1>
          <p className="text-lg text-white/40 max-w-xl mx-auto leading-relaxed">
            A comprehensive suite of tools designed to help African businesses manage, grow, and thrive.
          </p>
        </div>
      </section>

      {/* Products */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 space-y-32">
          {products.map((product, i) => (
            <div key={i} className={`grid lg:grid-cols-2 gap-16 items-center ${i % 2 === 1 ? 'lg:[direction:rtl]' : ''}`}>
              <div className={i % 2 === 1 ? 'lg:[direction:ltr]' : ''}>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${product.color} flex items-center justify-center mb-6 shadow-lg`}>
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={product.icon}/>
                  </svg>
                </div>
                <h2 className="text-3xl font-black text-[#0A140C] tracking-tight mb-4">{product.name}</h2>
                <p className="text-gray-500 text-base leading-relaxed mb-6">{product.desc}</p>
                <ul className="space-y-3">
                  {product.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm text-gray-600">
                      <svg className="w-5 h-5 text-[#00D4AA] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={`${i % 2 === 1 ? 'lg:[direction:ltr]' : ''}`}>
                <div className="rounded-3xl overflow-hidden shadow-2xl">
                  <img src={product.img} alt={product.name} className="w-full h-80 lg:h-[400px] object-cover" loading="lazy" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-[#0A140C] relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00D4AA]/10 rounded-full blur-[120px]" />
        </div>
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl font-black text-white tracking-tight mb-4">Ready to Get Started?</h2>
          <p className="text-white/40 mb-8">Join 500+ businesses already using M-TAI.</p>
          <Link to="/register" className="px-10 py-4 bg-gradient-to-r from-[#00D4AA] to-[#00B894] text-[#0A140C] font-bold text-sm rounded-full hover:shadow-xl hover:shadow-[#00D4AA]/25 transition-all duration-300 inline-block">
            Start Free Trial
          </Link>
        </div>
      </section>
    </>
  )
}
