import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Products', to: '/products' },
  { label: 'FAQ', to: '/faq' },
  { label: 'Contact', to: '/contact' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-[#0A140C]/95 backdrop-blur-xl border-b border-white/5 shadow-2xl shadow-black/20'
            : 'bg-[#0A140C] border-b border-white/5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-[72px]">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-[#00D4AA] to-[#00B894] rounded-xl flex items-center justify-center shadow-lg shadow-[#00D4AA]/20 group-hover:shadow-[#00D4AA]/40 transition-shadow duration-300">
                  <span className="text-[#0A140C] font-black text-lg">M</span>
                </div>
                <div className="absolute -inset-1 bg-[#00D4AA]/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <span className="text-white font-bold text-xl tracking-tight">M-TAI</span>
            </Link>

            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = link.to === '/' ? pathname === '/' : pathname.startsWith(link.to)
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`relative px-4 py-2 text-sm font-medium transition-colors duration-300 ${
                      isActive ? 'text-white' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {link.label}
                    <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-[#00D4AA] transition-all duration-300 rounded-full ${isActive ? 'w-6' : 'w-0 group-hover:w-6'}`} />
                  </Link>
                )
              })}
            </div>

            <div className="hidden lg:flex items-center gap-3">
              <Link to="/login" className="px-5 py-2.5 text-sm font-semibold text-white/80 hover:text-white transition-colors duration-300">
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-6 py-2.5 bg-gradient-to-r from-[#00D4AA] to-[#00B894] text-[#0A140C] text-sm font-bold rounded-full hover:shadow-lg hover:shadow-[#00D4AA]/25 transition-all duration-300 hover:scale-105"
              >
                Get Started
              </Link>
            </div>

            <button className="lg:hidden text-white p-2" onClick={() => setOpen(!open)}>
              <div className="w-6 h-5 flex flex-col justify-between">
                <span className={`w-full h-0.5 bg-white transition-all duration-300 ${open ? 'rotate-45 translate-y-2' : ''}`} />
                <span className={`w-full h-0.5 bg-white transition-all duration-300 ${open ? 'opacity-0' : ''}`} />
                <span className={`w-full h-0.5 bg-white transition-all duration-300 ${open ? '-rotate-45 -translate-y-2' : ''}`} />
              </div>
            </button>
          </div>
        </div>

        {open && (
          <div className="lg:hidden bg-[#0A140C]/95 backdrop-blur-xl border-t border-white/5 px-6 py-6">
            <ul className="flex flex-col gap-1 mb-6">
              {navLinks.map((link) => {
                const isActive = link.to === '/' ? pathname === '/' : pathname.startsWith(link.to)
                return (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      onClick={() => setOpen(false)}
                      className={`block px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                        isActive ? 'text-white bg-white/5' : 'text-white/70 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
            <div className="flex flex-col gap-3">
              <Link to="/login" onClick={() => setOpen(false)} className="text-center px-6 py-3 border border-white/20 text-white text-sm font-semibold rounded-full hover:bg-white/5 transition-all">
                Sign In
              </Link>
              <Link to="/register" onClick={() => setOpen(false)} className="text-center px-6 py-3 bg-gradient-to-r from-[#00D4AA] to-[#00B894] text-[#0A140C] text-sm font-bold rounded-full">
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>

      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-8 right-8 z-40 w-12 h-12 rounded-full bg-[#0A140C] border border-white/10 text-[#00D4AA] shadow-xl hover:bg-[#00D4AA] hover:text-[#0A140C] hover:border-[#00D4AA] transition-all duration-500 flex items-center justify-center ${
          scrolled ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>
    </>
  )
}
