import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function MainCta() {
  const { t } = useTranslation()

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
          <span className="text-xs font-semibold text-white/70">{t('site.mainCta.badge')}</span>
        </div>

        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] mb-6">
          {t('site.mainCta.title1')}<br />
          <span className="text-[#00D4AA]">{t('site.mainCta.title2')}</span>
        </h2>

        <p className="text-lg text-white/40 max-w-xl mx-auto mb-10 leading-relaxed">
          {t('site.mainCta.subtitle')}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
          <Link to="/register" className="px-10 py-4 bg-gradient-to-r from-[#00D4AA] to-[#00B894] text-[#0A140C] font-bold text-sm rounded-full hover:shadow-xl hover:shadow-[#00D4AA]/25 transition-all duration-300 hover:scale-105">
            {t('site.mainCta.cta1')}
          </Link>
          <Link to="/contact" className="px-10 py-4 border border-white/20 text-white font-semibold text-sm rounded-full hover:bg-white/5 hover:border-white/30 transition-all duration-300">
            {t('site.mainCta.cta2')}
          </Link>
        </div>

        <a
          href="/downloads/MTAI-App-v1.1.0.apk"
          download
          className="inline-flex items-center gap-2 px-6 py-3 mb-8 text-sm font-semibold text-[#00D4AA] hover:text-white border border-[#00D4AA]/30 hover:border-[#00D4AA]/60 rounded-full transition-all duration-300"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {t('site.mainCta.downloadApp')}
        </a>

        <p className="text-white/30 text-xs">{t('site.mainCta.note')}</p>
      </div>
    </section>
  )
}
