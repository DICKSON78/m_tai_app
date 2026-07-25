const articles = [
  {
    title: 'M-TAI Raises Seed Round to Expand Business Tech Across Africa',
    source: 'TechCrunch',
    date: 'Mar 2026',
    img: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    title: 'How Digital Tools Are Transforming SME Management in East Africa',
    source: 'Reuters',
    date: 'Feb 2026',
    img: 'https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    title: 'M-TAI Partners with Major Distributors for Seamless Supply Chain',
    source: 'Bloomberg',
    date: 'Jan 2026',
    img: 'https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
]

export default function News() {
  return (
    <section className="py-24 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="inline-block text-[#00D4AA] text-xs font-bold uppercase tracking-widest mb-4 border-b-2 border-[#00D4AA]/30 pb-1">
              Newsroom
            </span>
            <h2 className="text-4xl lg:text-5xl font-black text-[#0A140C] tracking-tight">In the News</h2>
          </div>
          <a href="#" className="text-[#00D4AA] text-sm font-semibold hover:text-[#00B894] transition-colors hidden sm:block">
            View All →
          </a>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article, i) => (
            <article key={i} className="group cursor-pointer">
              <div className="aspect-[16/10] bg-gray-100 overflow-hidden rounded-2xl mb-5">
                <img
                  src={article.img}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-gray-400 font-medium">{article.date}</span>
                <span className="text-gray-300">·</span>
                <span className="text-xs text-[#00D4AA] font-semibold">{article.source}</span>
              </div>
              <h3 className="text-[#0A140C] font-bold text-base leading-relaxed group-hover:text-[#00D4AA] transition-colors">{article.title}</h3>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
