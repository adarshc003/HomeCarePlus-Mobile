import auth, {PhoneAuthProvider} from '@react-native-firebase/auth';

// Neither verifyPhoneNumber() nor signInWithCredential() impose their own
// timeout — on a bad connection (or if Firebase's reCAPTCHA fallback never
// completes) the returned promise can hang indefinitely, leaving the
// caller's loading state stuck forever with no error to react to. Bounding
// it here guarantees these always settle. Rejects with a message-less
// Error() so existing callers' `error?.message || t('...')` fallbacks
// naturally show their already-localized generic failure text instead of
// a raw, untranslated "timed out" string.
const withTimeout = <T,>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout>;

  const timeout = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error()), timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => {
    clearTimeout(timeoutId);
  });
};

// Deliberately using the lower-level verifyPhoneNumber() with a 0-second
// auto-verify timeout instead of signInWithPhoneNumber() (which hardcodes a
// 60s timeout with no way to override it). With auto-verify enabled, a
// device that itself receives the OTP SMS races Android's own silent
// SMS-Retriever auto-verification against the user manually typing the same
// code — whichever reaches Firebase first "wins" the single verification
// session, and the loser gets auth/session-expired even with a correct,
// freshly-received code. This only happens on the device that owns the
// number being verified; forcing timeout=0 skips that auto-verify window
// entirely, so every login — on every device — is a plain manual code
// entry with no race to lose.
export const sendOTP = async (
  phone: string,
  forceResend = false,
) => {
  try {
    // verifyPhoneNumber() returns a thenable PhoneAuthListener, not a real
    // Promise (no .finally) — Promise.resolve() adopts it into one so
    // withTimeout's Promise.race can work with it.
    const snapshot = await withTimeout<{verificationId: string}>(
      Promise.resolve(auth().verifyPhoneNumber(phone, 0, forceResend)),
      30000,
    );
    return {verificationId: snapshot.verificationId};
  } catch (error) {
    console.log('Send OTP Error:', error);
    throw error;
  }
};

export const verifyOTP = async (
  session: {verificationId: string},
  code: string,
) => {
  try {
    const credential = PhoneAuthProvider.credential(
      session.verificationId,
      code,
    );

    const result = await withTimeout<any>(
      auth().signInWithCredential(credential),
      20000,
    );
    return result;
  } catch (error) {
    console.log('Verify OTP Error:', error);
    throw error;
  }
};
