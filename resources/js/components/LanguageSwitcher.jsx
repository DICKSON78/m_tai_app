import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher({ className = '' }) {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

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
