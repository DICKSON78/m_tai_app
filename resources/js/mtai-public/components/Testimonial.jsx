import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const testimonialMeta = [
  {
    initials: "AH",
    img: "https://images.pexels.com/photos/20122943/pexels-photo-20122943.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop",
  },
  {
    initials: "JM",
    img: "https://images.pexels.com/photos/12455720/pexels-photo-12455720.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop",
  },
  {
    initials: "SK",
    img: "https://images.pexels.com/photos/33837391/pexels-photo-33837391.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop",
  },
  {
    initials: "DO",
    img: "https://images.pexels.com/photos/19518395/pexels-photo-19518395.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop",
  },
  {
    initials: "GM",
    img: "https://images.pexels.com/photos/21674913/pexels-photo-21674913.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop",
  },
  {
    initials: "PO",
    img: "https://images.pexels.com/photos/21852749/pexels-photo-21852749.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop",
  },
  {
    initials: "FA",
    img: "https://images.pexels.com/photos/33569519/pexels-photo-33569519.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop",
  },
]

export default function Testimonial() {
  const { t } = useTranslation()
  const [current, setCurrent] = useState(0)
  const list = t('site.testimonials.list', { returnObjects: true })
  const testimonials = Array.isArray(list) ? list : []

  useEffect(() => {
    if (testimonials.length === 0) return
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [testimonials.length])

  const item = testimonials[current] || {}
  const meta = testimonialMeta[current] || {}

  return (
    <section className="py-24 lg:py-32 bg-gray-50 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="inline-block text-[#00D4AA] text-xs font-bold uppercase tracking-widest mb-4 border-b-2 border-[#00D4AA]/30 pb-1">
            {t('site.testimonials.eyebrow')}
          </span>
          <h2 className="text-4xl lg:text-5xl font-black text-[#0A140C] tracking-tight">
            {t('site.testimonials.title1')}{' '}
            <span className="text-[#00D4AA]">{t('site.testimonials.title2')}</span>
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
                "{item.quote || ''}"
              </p>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00D4AA] to-[#00B894] flex items-center justify-center">
                  <span className="text-white text-sm font-bold">{meta.initials || ''}</span>
                </div>
                <div>
                  <p className="text-white font-semibold">{item.name || ''}</p>
                  <p className="text-white/50 text-sm">{item.role || ''}</p>
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
              src={meta.img || ''}
              alt={item.name || ''}
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
