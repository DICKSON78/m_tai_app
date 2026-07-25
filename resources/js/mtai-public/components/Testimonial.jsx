import { useState, useEffect } from 'react'

const testimonials = [
  {
    quote: "M-TAI transformed how I manage my shop. From inventory to sales, everything is in one place. I've doubled my revenue in 6 months and my team loves how easy it is to use.",
    name: "Amina Hassan",
    role: "Shop Owner, Dar es Salaam",
    initials: "AH",
    img: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=400&fit=crop&crop=face",
  },
  {
    quote: "The analytics alone are worth it. I can see exactly what's selling and what's not. Makes ordering stock so much easier.",
    name: "Joseph Mwangi",
    role: "Retailer, Nairobi",
    initials: "JM",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
  },
  {
    quote: "Setup was incredibly fast. Within a day we were processing orders and tracking inventory. My team loves it.",
    name: "Sarah Kimani",
    role: "Manager, Kampala",
    initials: "SK",
    img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face",
  },
  {
    quote: "Finally a platform that understands African business. Mobile money integration works flawlessly.",
    name: "David Ochieng",
    role: "Wholesaler, Lagos",
    initials: "DO",
    img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face",
  },
  {
    quote: "The delivery tracking feature saved us so much time. Customers love knowing where their orders are.",
    name: "Grace Mwende",
    role: "E-commerce, Accra",
    initials: "GM",
    img: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=400&fit=crop&crop=face",
  },
  {
    quote: "Best decision we made for our business. The ROI was visible within the first month of using M-TAI.",
    name: "Peter Otieno",
    role: "Restaurant Owner, Mombasa",
    initials: "PO",
    img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face",
  },
  {
    quote: "Customer support is amazing. Anytime we have an issue, it's resolved within hours. Truly reliable.",
    name: "Fatima Ali",
    role: "Boutique Owner, Zanzibar",
    initials: "FA",
    img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face",
  },
]

export default function Testimonial() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const t = testimonials[current]

  return (
    <section className="py-24 lg:py-32 bg-gray-50 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="inline-block text-[#00D4AA] text-xs font-bold uppercase tracking-widest mb-4 border-b-2 border-[#00D4AA]/30 pb-1">
            Testimonials
          </span>
          <h2 className="text-4xl lg:text-5xl font-black text-[#0A140C] tracking-tight">
            Loved by Business Owners Across{' '}
            <span className="text-[#00D4AA]">Africa</span>
          </h2>
        </div>

        {/* Slideshow card */}
        <div className="bg-[#0A140C] rounded-2xl p-8 lg:p-12 relative overflow-hidden min-h-[320px]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#00D4AA]/10 rounded-full blur-[80px]" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#00D4AA]/5 rounded-full blur-[60px]" />

          <div className="relative z-10 flex items-start gap-8">
            <div className="flex-1">
              <svg className="w-12 h-12 text-[#00D4AA]/30 mb-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151C7.563 6.068 6 8.789 6 11h4v10H0z" />
              </svg>

              <p className="text-white/90 text-lg lg:text-xl leading-relaxed mb-8 transition-all duration-500">
                "{t.quote}"
              </p>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00D4AA] to-[#00B894] flex items-center justify-center">
                  <span className="text-white text-sm font-bold">{t.initials}</span>
                </div>
                <div>
                  <p className="text-white font-semibold">{t.name}</p>
                  <p className="text-white/50 text-sm">{t.role}</p>
                </div>
                <div className="hidden sm:flex items-center gap-1 ml-auto">
                  {[1,2,3,4,5].map(s => (
                    <svg key={s} className="w-4 h-4 text-[#D4A853]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
            </div>

            <img
              src={t.img}
              alt={t.name}
              className="hidden lg:block w-48 h-48 rounded-2xl object-cover border border-white/10 shrink-0 transition-all duration-500"
              loading="lazy"
            />
          </div>

          {/* Dots */}
          <div className="flex items-center justify-center gap-2 mt-8">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i === current ? 'bg-[#00D4AA] w-6' : 'bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
