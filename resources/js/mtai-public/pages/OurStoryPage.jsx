import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function OurStoryPage() {
  const { t } = useTranslation()
  const sections = t('site.ourStory.sections', { returnObjects: true })
  const sectionList = Array.isArray(sections) ? sections : []

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
            {t('site.ourStory.eyebrow')}
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.05] mb-6">
            {t('site.ourStory.title')}
          </h1>
          <p className="text-lg text-[#00D4AA] font-semibold max-w-2xl mx-auto leading-relaxed">
            {t('site.ourStory.subtitle')}
          </p>
        </div>
      </section>

      {/* Story sections */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-[320px_1fr] gap-16 items-start">
            <div className="lg:sticky lg:top-28">
              <div className="rounded-3xl overflow-hidden shadow-2xl bg-[#F7FBFA]">
                <img
                  src="/img/forWeblogo.png"
                  alt={t('site.about.storyImageAlt')}
                  className="w-full h-auto object-contain"
                />
              </div>
              <p className="text-[#00D4AA] text-xs font-bold uppercase tracking-widest mt-6">
                Big Brain Company Limited
              </p>
            </div>

            <div className="space-y-14">
              {sectionList.map((section, i) => (
                <div key={i}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-8 h-8 rounded-full bg-[#00D4AA]/10 text-[#00B894] text-sm font-black flex items-center justify-center shrink-0">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h2 className="text-2xl lg:text-3xl font-black text-[#0A140C] tracking-tight">
                      {section.title}
                    </h2>
                  </div>
                  <p className="text-gray-500 text-base leading-relaxed">{section.text}</p>
                </div>
              ))}

              <div className="pt-6 border-t border-gray-100">
                <p className="text-xl font-black text-[#0A140C] tracking-tight">
                  {t('site.ourStory.closing')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-[#0A140C] relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00D4AA]/10 rounded-full blur-[120px]" />
        </div>
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl font-black text-white tracking-tight mb-4">{t('site.productsPage.ctaTitle')}</h2>
          <p className="text-white/40 mb-8">{t('site.productsPage.ctaSubtitle')}</p>
          <Link to="/register" className="px-10 py-4 bg-gradient-to-r from-[#00D4AA] to-[#00B894] text-[#0A140C] font-bold text-sm rounded-full hover:shadow-xl hover:shadow-[#00D4AA]/25 transition-all duration-300 inline-block">
            {t('site.productsPage.ctaButton')}
          </Link>
        </div>
      </section>
    </>
  )
}
