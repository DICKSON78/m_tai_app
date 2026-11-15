import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const modeIcons = [
  'M5 17a2 2 0 104 0 2 2 0 00-4 0zm10 0a2 2 0 104 0 2 2 0 00-4 0zM5 17h4l2-6h4l3 6M9 11h4M3 13h2',
  'M3 16V7a1 1 0 011-1h9v10M13 7h4l4 4v5h-2M3 16h2m4 0h6m-6 0a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0',
  'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0',
  'M3 9h12v8H3zM15 12h4l2 5M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m10 0a2 2 0 104 0m-4 0a2 2 0 114 0M3 17h18',
  'M8 3h8a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2h2m-2 7h12M9 16l-2 5m8-5l2 5M9 19h6',
  'M3 18l2-7h14l2 7M6 11V7a1 1 0 011-1h10a1 1 0 011 1v4M12 3v3M7 18h10',
  'M10.5 6.5L12 3l1.5 3.5L21 9l-7.5 1.5L12 21l-1.5-10.5L3 9l7.5-2.5z',
]

const serviceIcons = [
  'M13 10V3L4 14h7v7l9-11h-7z',
  'M9 17a2 2 0 11-4 0 2 2 0 014 0zm0 0h6m-6 0a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 10-4 0 2 2 0 004 0zm0 0h2M3 9l1-5h9l2 5M3 9h18',
  'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
]

export default function TransportPage() {
  const { t } = useTranslation()
  const modes = t('site.transportPage.modes', { returnObjects: true })
  const modeList = Array.isArray(modes) ? modes : []
  const services = t('site.transportPage.services', { returnObjects: true })
  const serviceList = Array.isArray(services) ? services : []
  const steps = t('site.transportPage.steps', { returnObjects: true })
  const stepList = Array.isArray(steps) ? steps : []
  const audiences = t('site.transportPage.audiences', { returnObjects: true })
  const audienceList = Array.isArray(audiences) ? audiences : []

  return (
    <>
      {/* Hero */}
      <section className="bg-[#0A140C] py-32 lg:py-40 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00D4AA]/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#18230F]/10 rounded-full blur-[100px]" />
        </div>
        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <span className="inline-block px-4 py-1.5 bg-white/5 border border-white/10 text-[#00D4AA] text-xs font-bold uppercase tracking-widest rounded-full mb-6">
            {t('site.transportPage.heroEyebrow')}
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08] mb-6">
            {t('site.transportPage.heroTitle')}
          </h1>
          <p className="text-lg text-white/50 max-w-2xl mx-auto leading-relaxed">
            {t('site.transportPage.heroSubtitle')}
          </p>
          <div className="mt-6 space-y-4 text-white/40 max-w-3xl mx-auto leading-relaxed">
            <p>{t('site.transportPage.heroText1')}</p>
            <p>{t('site.transportPage.heroText2')}</p>
          </div>
          <p className="text-[#00D4AA] text-sm font-bold uppercase tracking-widest mt-8">
            {t('site.transportPage.heroTagline')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <Link
              to="/register/customer"
              className="px-8 py-4 bg-gradient-to-r from-[#00D4AA] to-[#00B894] text-[#0A140C] font-bold text-sm rounded-full hover:shadow-xl hover:shadow-[#00D4AA]/25 transition-all duration-300 text-center"
            >
              {t('site.transportPage.postCargo')}
            </Link>
            <Link
              to="/register/seller"
              className="px-8 py-4 border border-white/20 text-white font-semibold text-sm rounded-full hover:bg-white/5 transition-all duration-300 text-center"
            >
              {t('site.transportPage.registerTransporter')}
            </Link>
          </div>
        </div>
      </section>

      {/* Transport modes */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block text-[#00D4AA] text-xs font-bold uppercase tracking-widest mb-4 border-b-2 border-[#00D4AA]/30 pb-1">
              {t('site.transportPage.modesEyebrow')}
            </span>
            <h2 className="text-4xl lg:text-5xl font-black text-[#0A140C] tracking-tight">
              {t('site.transportPage.modesTitle')}
            </h2>
            <p className="text-gray-500 text-base mt-4 max-w-2xl mx-auto leading-relaxed">
              {t('site.transportPage.modesIntro')}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {modeList.map((mode, i) => (
              <div key={i} className="group bg-white p-7 rounded-2xl border border-gray-100 hover:border-transparent hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-500">
                <div className="w-14 h-14 rounded-2xl bg-[#00D4AA]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 text-[#00D4AA]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={modeIcons[i]} />
                  </svg>
                </div>
                <h3 className="text-[#0A140C] font-bold text-lg mb-2">{mode.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{mode.desc}</p>
              </div>
            ))}
          </div>

          <p className="text-gray-500 text-base leading-relaxed max-w-3xl mx-auto text-center mt-12">
            {t('site.transportPage.modesClosing')}
          </p>
        </div>
      </section>

      {/* Delivery services */}
      <section className="py-24 lg:py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block text-[#00D4AA] text-xs font-bold uppercase tracking-widest mb-4 border-b-2 border-[#00D4AA]/30 pb-1">
              {t('site.transportPage.servicesEyebrow')}
            </span>
            <h2 className="text-4xl lg:text-5xl font-black text-[#0A140C] tracking-tight">
              {t('site.transportPage.servicesTitle')}
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {serviceList.map((service, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00D4AA] to-[#00B894] flex items-center justify-center mb-6 shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={serviceIcons[i]} />
                  </svg>
                </div>
                <h3 className="text-[#0A140C] font-black text-xl mb-1 uppercase tracking-tight">{service.title}</h3>
                <p className="text-[#00D4AA] text-sm font-semibold mb-3">{service.tagline}</p>
                <p className="text-gray-500 text-sm leading-relaxed">{service.desc}</p>
              </div>
            ))}
          </div>

          <p className="text-gray-500 text-base leading-relaxed max-w-3xl mx-auto text-center mt-12">
            {t('site.transportPage.servicesClosing')}
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 lg:py-32 bg-[#0A140C] relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-[#00D4AA]/5 rounded-full blur-[120px]" />
        </div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <span className="inline-block text-[#00D4AA] text-xs font-bold uppercase tracking-widest mb-4 border-b-2 border-[#00D4AA]/30 pb-1">
              {t('site.transportPage.howEyebrow')}
            </span>
            <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tight">
              {t('site.transportPage.howTitle')}
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {stepList.map((step, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-7">
                <span className="text-[#00D4AA] text-3xl font-black tracking-tight">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="text-white font-bold text-lg mt-4 mb-2">{step.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

          <p className="text-white/40 text-sm leading-relaxed max-w-3xl mx-auto text-center mt-10 border-t border-white/10 pt-8">
            {t('site.transportPage.note')}
          </p>
        </div>
      </section>

      {/* Audiences */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block text-[#00D4AA] text-xs font-bold uppercase tracking-widest mb-4 border-b-2 border-[#00D4AA]/30 pb-1">
              {t('site.transportPage.audienceEyebrow')}
            </span>
            <h2 className="text-4xl lg:text-5xl font-black text-[#0A140C] tracking-tight">
              {t('site.transportPage.audienceTitle')}
            </h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {audienceList.map((group, i) => (
              <div key={i} className="bg-gray-50 p-8 rounded-2xl border border-gray-100">
                <h3 className="text-[#0A140C] font-black text-xl mb-6">{group.title}</h3>
                <ul className="space-y-3">
                  {(Array.isArray(group.items) ? group.items : []).map((item, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm text-gray-600">
                      <svg className="w-5 h-5 text-[#00D4AA] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 lg:py-32 bg-[#0A140C] relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00D4AA]/10 rounded-full blur-[120px]" />
        </div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tight mb-6">
            {t('site.transportPage.finalTitle')}
          </h2>
          <div className="space-y-4 text-white/40 max-w-2xl mx-auto leading-relaxed">
            <p>{t('site.transportPage.finalText1')}</p>
            <p>{t('site.transportPage.finalText2')}</p>
          </div>
          <p className="text-[#00D4AA] font-semibold mt-6">{t('site.transportPage.finalText3')}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <Link
              to="/register/customer"
              className="px-8 py-4 bg-gradient-to-r from-[#00D4AA] to-[#00B894] text-[#0A140C] font-bold text-sm rounded-full hover:shadow-xl hover:shadow-[#00D4AA]/25 transition-all duration-300 text-center"
            >
              {t('site.transportPage.postCargoCta')}
            </Link>
            <Link
              to="/register/seller"
              className="px-8 py-4 border border-white/20 text-white font-semibold text-sm rounded-full hover:bg-white/5 transition-all duration-300 text-center"
            >
              {t('site.transportPage.joinCta')}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer strip */}
      <section className="py-12 bg-[#0F1A0B] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-white font-bold text-sm">{t('site.transportPage.footerCompany')}</p>
          <p className="text-white/40 text-sm mt-1">{t('site.transportPage.footerCompanyText')}</p>
          <p className="text-[#00D4AA] text-sm font-semibold mt-4">{t('site.transportPage.footerTagline')}</p>
          <p className="text-white/50 text-xs mt-1">{t('site.transportPage.footerSuccess')}</p>
        </div>
      </section>
    </>
  )
}
