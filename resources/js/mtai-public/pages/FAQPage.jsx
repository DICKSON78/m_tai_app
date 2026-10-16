import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function FAQPage() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(null)
  const faqs = t('site.faq.list', { returnObjects: true })
  const faqTexts = Array.isArray(faqs) ? faqs : []

  return (
    <>
      {/* Hero */}
      <section className="bg-[#0A140C] py-32 lg:py-40 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00D4AA]/10 rounded-full blur-[120px]" />
        </div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <span className="inline-block px-4 py-1.5 bg-white/5 border border-white/10 text-[#00D4AA] text-xs font-bold uppercase tracking-widest rounded-full mb-6">
            {t('site.faq.heroEyebrow')}
          </span>
          <h1 className="text-5xl sm:text-6xl font-black text-white tracking-tight leading-[1.05] mb-6">
            {t('site.faq.heroTitle1')}<br />{t('site.faq.heroTitle2')}
          </h1>
          <p className="text-lg text-white/40 max-w-xl mx-auto leading-relaxed">
            {t('site.faq.heroSubtitle')}
          </p>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <div className="space-y-3">
            {faqTexts.map((faq, i) => (
              <div key={i} className="border border-gray-100 rounded-2xl overflow-hidden hover:border-gray-200 transition-colors">
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="text-[#0A140C] font-semibold text-sm pr-4">{faq.q}</span>
                  <svg
                    className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-300 ${open === i ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {open === i && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-500 text-sm leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-16 text-center bg-gray-50 rounded-2xl p-10">
            <h3 className="text-[#0A140C] font-bold text-lg mb-2">{t('site.faq.stillTitle')}</h3>
            <p className="text-gray-500 text-sm mb-6">{t('site.faq.stillSubtitle')}</p>
            <Link to="/contact" className="px-8 py-3.5 bg-gradient-to-r from-[#00D4AA] to-[#00B894] text-[#0A140C] font-bold text-sm rounded-full hover:shadow-xl hover:shadow-[#00D4AA]/25 transition-all duration-300 inline-block">
              {t('site.faq.contactCta')}
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
