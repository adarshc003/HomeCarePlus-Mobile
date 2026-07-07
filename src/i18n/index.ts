import en from '../locales/en';
import ar from '../locales/ar';

export const translations = {
  en,
  ar,
};

export const t = (
  key: string,
  language: 'en' | 'ar',
) => {
  return (
    (translations[
      language
    ] as any)[key] || key
  );
};