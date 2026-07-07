export const getString = (
  value: unknown,
  fallback = '',
): string => {
  if (typeof value === 'string') {
    return value;
  }

  return fallback;
};