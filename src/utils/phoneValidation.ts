export interface PhoneCountry {
  nameKey: string;
  flag: string;
  code: string;
  maxLength: number;
}

// Same countries/lengths LoginScreen validates a phone number against —
// single source of truth so every screen that validates a phone uses
// identical rules instead of re-declaring the country list/lengths.
export const PHONE_COUNTRIES: PhoneCountry[] = [
  {
    nameKey: 'countrySaudiArabia',
    flag: '🇸🇦',
    code: '+966',
    maxLength: 9,
  },
  {
    nameKey: 'countryIndia',
    flag: '🇮🇳',
    code: '+91',
    maxLength: 10,
  },
];

// Exact rule LoginScreen uses once a country is selected: digit count must
// match that country's expected length.
export const isValidPhoneForCountry = (
  phone: string,
  country: PhoneCountry,
): boolean => phone.length === country.maxLength;

// For fields with no country selector (e.g. Secondary Phone on the
// Address screen): valid if it matches ANY supported country's length.
export const isValidPhoneAnyCountry = (phone: string): boolean =>
  PHONE_COUNTRIES.some(country => isValidPhoneForCountry(phone, country));

// Splits a saved phone value back into {country, localNumber} for
// pre-filling an edit form — mirrors the same country list Login and the
// Address screen already validate against. Handles both a proper E.164
// value (a country code prefix) and a legacy bare-digit value saved before
// the country selector existed (guessed by matching digit length).
export const parsePhoneWithCountry = (
  value: string | undefined | null,
): {country: PhoneCountry; localNumber: string} => {
  const raw = (value || '').trim();

  if (!raw) {
    return {country: PHONE_COUNTRIES[0], localNumber: ''};
  }

  const byPrefix = PHONE_COUNTRIES.find(country => raw.startsWith(country.code));
  if (byPrefix) {
    return {country: byPrefix, localNumber: raw.slice(byPrefix.code.length)};
  }

  const byLength = PHONE_COUNTRIES.find(country => raw.length === country.maxLength);
  if (byLength) {
    return {country: byLength, localNumber: raw};
  }

  return {country: PHONE_COUNTRIES[0], localNumber: raw};
};
