// Mirrors website/src/utils/authErrors.ts — maps Firebase phone-auth error
// codes to distinct, translated messages instead of one generic fallback,
// so a specific failure (expired session, too many attempts, bad number)
// tells the user what actually happened and what to do about it.
const FIREBASE_ERROR_KEYS: Record<string, string> = {
  'auth/invalid-phone-number': 'otpInvalidPhoneNumber',
  'auth/missing-phone-number': 'otpInvalidPhoneNumber',
  'auth/too-many-requests': 'otpTooManyAttempts',
  'auth/quota-exceeded': 'otpTooManyAttempts',
  'auth/session-expired': 'otpExpired',
  'auth/code-expired': 'otpExpired',
  'auth/invalid-verification-code': 'invalidOtp',
  'auth/invalid-verification-id': 'otpExpired',
  'auth/network-request-failed': 'otpNetworkError',
  'auth/captcha-check-failed': 'otpVerificationFailed',
  'auth/internal-error': 'otpVerificationFailed',
  'auth/user-disabled': 'otpUserDisabled',
};

export function resolveOtpErrorKey(error: unknown): string {
  const code = (error as {code?: string} | null)?.code;
  return (code && FIREBASE_ERROR_KEYS[code]) || '';
}
