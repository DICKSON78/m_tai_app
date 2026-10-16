import { useTranslation } from 'react-i18next'

const articleMeta = [
  {
    source: 'TechCrunch',
    date: 'Mar 2026',
    img: 'https://images.pexels.com/photos/9301763/pexels-photo-9301763.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    source: 'Reuters',
    date: 'Feb 2026',
    img: 'https://images.pexels.com/photos/20068076/pexels-photo-20068076.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    source: 'Bloomberg',
    date: 'Jan 2026',
    img: 'https://images.pexels.com/photos/37562258/pexels-photo-37562258.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
]

export default function News() {
  const { t } = useTranslation()
  const titles = t('site.news.list', { returnObjects: true })
  const titleTexts = Array.isArray(titles) ? titles : []

  return (
    <section className="py-24 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="inline-block text-[#00D4AA] text-xs font-bold uppercase tracking-widest mb-4 border-b-2 border-[#00D4AA]/30 pb-1">
              {t('site.news.eyebrow')}
            </span>
            <h2 className="text-4xl lg:text-5xl font-black text-[#0A140C] tracking-tight">{t('site.news.title')}</h2>
          </div>
          <a href="#" className="text-[#00D4AA] text-sm font-semibold hover:text-[#00B894] transition-colors hidden sm:block">
            {t('site.news.viewAll')}
          </a>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {articleMeta.map((article, i) => (
            <article key={i} className="group cursor-pointer">
              <div className="aspect-[16/10] bg-gray-100 overflow-hidden rounded-2xl mb-5">
                <img
                  src={article.img}
                  alt={titleTexts[i] || ''}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-gray-400 font-medium">{article.date}</span>
                <span className="text-gray-300">·</span>
                <span className="text-xs text-[#00D4AA] font-semibold">{article.source}</span>
              </div>
              <h3 className="text-[#0A140C] font-bold text-base leading-relaxed group-hover:text-[#00D4AA] transition-colors">{titleTexts[i] || ''}</h3>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
