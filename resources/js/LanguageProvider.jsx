import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function LanguageProvider({ children }) {
  const { i18n } = useTranslation();

  useEffect(() => {
    const lang = i18n.language || 'en';
    document.documentElement.lang = lang;
  }, [i18n.language]);

  return children;
}
