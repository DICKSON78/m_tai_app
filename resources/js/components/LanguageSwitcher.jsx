import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher({ className = '', variant = 'select' }) {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setOpen(false);
  };

  useEffect(() => {
    if (variant !== 'dropdown' || !open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, variant]);

  const current = (i18n.language || 'en').startsWith('sw') ? 'sw' : 'en';

  if (variant === 'dropdown') {
    return (
      <div ref={ref} className={`relative ${className}`}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-current hover:opacity-80 transition-opacity"
        >
          <span className="uppercase tracking-wide">{current}</span>
          <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-40 bg-[#0A140C] border border-white/10 rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50">
            {[
              { code: 'en', label: t('common.english') },
              { code: 'sw', label: t('common.swahili') },
            ].map((l) => (
              <button
                key={l.code}
                onClick={() => changeLanguage(l.code)}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                  current === l.code ? 'text-white bg-white/10 font-semibold' : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {l.label}
                {current === l.code && (
                  <svg className="w-4 h-4 text-[#00D4AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Globe className="w-4 h-4 text-current opacity-70" />
      <select
        value={i18n.language}
        onChange={(e) => changeLanguage(e.target.value)}
        className="text-sm bg-white/10 border border-white/10 rounded-full px-2 py-1 focus:ring-0 text-current cursor-pointer [&>option]:text-gray-900"
      >
        <option value="en">{t('common.english')}</option>
        <option value="sw">{t('common.swahili')}</option>
      </select>
    </div>
  );
}
