export const getLocalizedText = (
  value: any,
  language: 'en' | 'ar',
) => {
  if (!value) {
    return '';
  }

  if (typeof value === 'object') {
    return language === 'ar'
      ? value.ar || value.en || ''
      : value.en || value.ar || '';
  }

  return value;
};