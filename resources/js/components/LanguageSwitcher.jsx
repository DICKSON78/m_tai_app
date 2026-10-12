import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher({ className = '' }) {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Globe className="w-4 h-4 text-gray-500" />
      <select
        value={i18n.language}
        onChange={(e) => changeLanguage(e.target.value)}
        className="text-sm bg-transparent border-none focus:ring-0 text-gray-700 cursor-pointer"
      >
        <option value="en">{t('common.english')}</option>
        <option value="sw">{t('common.swahili')}</option>
      </select>
    </div>
  );
}
