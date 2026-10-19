import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const CONTACT_ICONS = {
  phone: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
  mail: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  globe: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9',
  pin: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z',
  user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
}

const contactHref = (icon, value) => {
  if (icon === 'mail') return `mailto:${value}`
  if (icon === 'phone') return `tel:${value.replace(/\s/g, '')}`
  if (icon === 'globe') return value.startsWith('http') ? value : `https://${value}`
  return null
}

export default function Footer() {
  const { t } = useTranslation()
  const productLinks = t('site.footer.productLinks', { returnObjects: true })
  const companyLinks = t('site.footer.companyLinks', { returnObjects: true })
  const resourceLinks = t('site.footer.resourceLinks', { returnObjects: true })
  const legalLinks = t('site.footer.legalLinks', { returnObjects: true })
  const contact = t('site.footer.contact', { returnObjects: true })
  const contactData = contact && typeof contact === 'object' ? contact : null

  return (
    <footer className="bg-[#0A140C] border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-10">
          <div className="col-span-2 md:col-span-4 lg:col-span-1 mb-4 lg:mb-0">
            <Link to="/" className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg shadow-black/20 overflow-hidden">
                <img src="/icons/icon-96x96.png?v=2" alt="M-TAI" className="w-7 h-7 rounded-full object-cover" />
              </div>
              <span className="text-white font-black text-xl tracking-tight">M-TAI</span>
            </Link>
            <p className="text-white/40 text-sm leading-relaxed max-w-[280px]">
              {t('site.footer.tagline')}
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4">{t('site.footer.product')}</h4>
            <ul className="space-y-3">
              {(Array.isArray(productLinks) ? productLinks : []).map((item) => (
                <li key={item}>
                  <a href="#" className="text-white/40 text-sm hover:text-[#00D4AA] transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4">{t('site.footer.company')}</h4>
            <ul className="space-y-3">
              {(Array.isArray(companyLinks) ? companyLinks : []).map((item) => (
                <li key={item}>
                  <a href="#" className="text-white/40 text-sm hover:text-[#00D4AA] transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4">{t('site.footer.resources')}</h4>
            <ul className="space-y-3">
              {(Array.isArray(resourceLinks) ? resourceLinks : []).map((item) => (
                <li key={item}>
                  <a href="#" className="text-white/40 text-sm hover:text-[#00D4AA] transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4">{t('site.footer.legal')}</h4>
            <ul className="space-y-3">
              {(Array.isArray(legalLinks) ? legalLinks : []).map((item) => (
                <li key={item}>
                  <a href="#" className="text-white/40 text-sm hover:text-[#00D4AA] transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {contactData && (
            <div className="col-span-2 md:col-span-4 lg:col-span-1">
              <h4 className="text-white font-semibold text-sm mb-4">{contactData.heading}</h4>
              <p className="text-[#00D4AA] text-[11px] font-bold uppercase tracking-widest mb-4">{contactData.subheading}</p>
              <ul className="space-y-3.5">
                {(Array.isArray(contactData.items) ? contactData.items : []).map((item) => {
                  const href = contactHref(item.icon, item.value)
                  return (
                    <li key={item.label} className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-[#00D4AA] shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d={CONTACT_ICONS[item.icon] || CONTACT_ICONS.globe} />
                      </svg>
                      <div className="min-w-0">
                        <span className="block text-white/35 text-[11px] leading-tight">{item.label}</span>
                        {href ? (
                          <a href={href} className="block text-white/70 text-sm leading-snug hover:text-[#00D4AA] transition-colors break-words">{item.value}</a>
                        ) : (
                          <span className="block text-white/70 text-sm leading-snug break-words">{item.value}</span>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-xs">
            © {new Date().getFullYear()} M-TAI. {t('site.footer.rights')}
          </p>
          <div className="flex gap-4">
            {[
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" /></svg>,
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641 0 12.017 0z" /></svg>,
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>,
            ].map((icon, i) => (
              <a key={i} href="#" className="w-9 h-9 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-white/40 hover:text-[#00D4AA] hover:border-[#00D4AA]/30 transition-all">
                {icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
