import React, {
  useState,
  useEffect,
  useRef,
} from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import {verifyOTP, sendOTP} from '../../services/firebaseAuth';

import {firebaseLogin} from '../../services/authService';

import {reregisterFCMToken} from '../../services/notificationService';

import {useAuthStore} from '../../store/authStore';
import {showSuccess, showError} from '../../utils/showToast';

import {parsePhoneWithCountry} from '../../utils/phoneValidation';

import {resolveOtpErrorKey} from '../../utils/authErrors';

import {useLanguageStore} from '../../store/languageStore';

import {t} from '../../i18n';

import {Fonts} from '../../constants/fonts';

import {useTheme} from '../../hooks/useTheme';

import Ionicons from '@react-native-vector-icons/ionicons';

const OtpScreen = ({
  navigation,
  route,
}: any) => {
  // route.params is always supplied by every current caller, but nothing
  // enforces that (this screen is typed `any`) — guarding here prevents a
  // future deep-link/push-navigation path that omits it from crashing on
  // this destructure.
  // `confirmation` here is a lightweight `{verificationId}` session object
  // (see services/firebaseAuth.ts), not a Firebase ConfirmationResult — kept
  // under this param name to avoid touching the shared navigation types.
  const {phone, confirmation, redirectTo} = route.params ?? {};

  const login = useAuthStore(state => state.login);

  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(30);
  const [resendLoading, setResendLoading] = useState(false);
  const [currentConfirmation, setCurrentConfirmation] =
    useState(confirmation);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(false);

  const language = useLanguageStore(state => state.language);

  const {colors} = useTheme();
  const styles = createStyles(colors);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;

  // ── Timer countdown ───────────────────────────────────────────────────────
  useEffect(() => {
    if (timer <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setTimer(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  // ── Timer progress bar ────────────────────────────────────────────────────
  useEffect(() => {
    progressAnim.setValue(1);

    Animated.timing(progressAnim, {
      toValue: 0,
      duration: 30000,
      useNativeDriver: false,
    }).start();
  }, [currentConfirmation]);

  // ── Shake on error ────────────────────────────────────────────────────────
  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {toValue: 8,  duration: 55, useNativeDriver: true}),
      Animated.timing(shakeAnim, {toValue: -8, duration: 55, useNativeDriver: true}),
      Animated.timing(shakeAnim, {toValue: 6,  duration: 55, useNativeDriver: true}),
      Animated.timing(shakeAnim, {toValue: -6, duration: 55, useNativeDriver: true}),
      Animated.timing(shakeAnim, {toValue: 0,  duration: 55, useNativeDriver: true}),
    ]).start();
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    if (!otp) {
      setError(t('otpRequired', language));
      triggerShake();
      return;
    }

    if (otp.length !== 6) {
      setError(t('enterValid6DigitOtp', language));
      triggerShake();
      return;
    }

    setError('');

    try {
      setLoading(true);

      const result = await verifyOTP(currentConfirmation, otp);

      const firebasePhone = result.user.phoneNumber;

      // Strips whichever country code was actually used (Saudi Arabia or
      // India), not a hardcoded one — a literal "+91" here left Saudi
      // numbers with their full "+966..." prefix still attached.
      const phoneWithoutCode = firebasePhone
        ? parsePhoneWithCountry(firebasePhone).localNumber
        : firebasePhone;

      // The backend now verifies this token itself and derives the phone
      // number from it — the phone above is sent only for logging and is
      // never trusted for authentication.
      const idToken = await result.user.getIdToken();

      const response = await firebaseLogin(idToken, phoneWithoutCode);

      await login(
        response.data.token,
        response.data.user,
        phoneWithoutCode,
      );

      // The app-start FCM registration attempt (NotificationProvider) runs
      // before login on a fresh install and is never retried — re-send the
      // already-obtained token now that a valid session exists, so the
      // very first booking after this login can actually notify.
      await reregisterFCMToken();

      showSuccess(t('loginSuccessful', language), t('welcomeBack', language));

      const targetRoute = redirectTo || 'Home';

      // Login/Otp are presented as transparentModal (RootNavigator). On iOS,
      // react-native-screens' native-stack leaves the underlying screen with
      // a stale frame/safe-area when replacing out of a presented modal
      // (fixed only by a full relaunch) — resetting the stack instead of
      // replacing avoids that stale modal-presentation context. Android's
      // fragment-based presentation never hit this, so it keeps the
      // existing, already-working replace() behavior untouched.
      if (Platform.OS === 'ios') {
        navigation.reset({
          index: 0,
          routes: [{name: targetRoute}],
        });
      } else {
        navigation.replace(targetRoute);
      }
    } catch (error: any) {
      console.log(error);

      // Different failures need different user actions (resend, wait, fix
      // the number) than a genuinely wrong code — showing the generic
      // "Invalid OTP" message for all of them left users retyping a code
      // that could never succeed.
      const errorKey = resolveOtpErrorKey(error);
      const message = errorKey
        ? t(errorKey, language)
        : error?.message || t('invalidOtp', language);

      setError(message);
      triggerShake();

      showError(t('failed', language), message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setResendLoading(true);

      // `phone` (route param) is already the fully composed E.164 number
      // set by LoginScreen (`${country.code}${phone}`) — it must not be
      // re-prefixed here. Doing so previously broke resend for every
      // non-Indian (Saudi) number. `forceResend: true` tells Firebase this
      // is an intentional re-send of the same number, not a fresh request.
      const newConfirmation = await sendOTP(phone, true);

      setCurrentConfirmation(newConfirmation);
      setTimer(30);
      // The old code (if any was typed before resending) belongs to the
      // now-invalidated confirmation above — leaving it in place invited
      // the user to just tap Verify again with a code that can never work.
      setOtp('');
      setError('');

      showSuccess(t('otpSentTitle', language), t('newOtpSent', language));
    } catch (error) {
      const errorKey = resolveOtpErrorKey(error);
      showError(
        t('failed', language),
        errorKey ? t(errorKey, language) : t('unableToResendOtp', language),
      );
    } finally {
      setResendLoading(false);
    }
  };

  const isValid = otp.length === 6;

  // ── OTP character dots ────────────────────────────────────────────────────
  const renderDots = () =>
    [0, 1, 2, 3, 4, 5].map(i => {
      const char = otp[i];
      const isCurrent = otp.length === i && focused;

      return (
        <View
          key={i}
          style={[
            styles.otpDot,
            char ? styles.otpDotFilled : null,
            isCurrent ? styles.otpDotActive : null,
            error && !char ? styles.otpDotError : null,
          ]}>
          {char ? (
            <Text style={styles.otpDotText}>{char}</Text>
          ) : isCurrent ? (
            <View style={styles.cursor} />
          ) : null}
        </View>
      );
    });

  return (
    <KeyboardAvoidingView
      style={styles.overlay}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.sheet}>

        {/* ── Handle ── */}
        <View style={styles.handle} />

        {/* ── Header ── */}
        <View style={styles.headerRow}>
          <View style={styles.otpIconWrap}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={22}
              color={colors.primary}
            />
          </View>

          <View style={styles.headerTextBlock}>
            <Text style={styles.title}>
              {t('verifyOtp', language)}
            </Text>
            <Text style={styles.subtitle}>
              {t('otpSentTo', language)}
            </Text>
          </View>
        </View>

        {/* ── Phone number ── */}
        <View style={styles.phoneRow}>
          <View style={styles.phonePill}>
            <Ionicons
              name="call-outline"
              size={14}
              color={colors.primary}
            />
            <Text style={styles.phone}> {phone}</Text>
          </View>

          <TouchableOpacity
            style={styles.changeBtn}
            activeOpacity={0.75}
            disabled={loading || resendLoading}
            onPress={() => navigation.goBack()}>
            <Text style={styles.changeBtnText}>
              {t('changeNumber', language)}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── OTP dots (visual) + hidden input ── */}
        <Animated.View
          style={{transform: [{translateX: shakeAnim}]}}>
          <View style={styles.dotsRow}>{renderDots()}</View>

          {/* Hidden real TextInput behind the dots */}
          <TextInput
            placeholder=""
            keyboardType="number-pad"
            autoFocus={Platform.OS === 'ios'}
            maxLength={6}
            value={otp}
            onChangeText={text => {
              setOtp(text);
              if (error) setError('');
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={styles.hiddenInput}
            caretHidden
          />
        </Animated.View>

        {/* ── Error ── */}
        {error ? (
          <View style={styles.errorRow}>
            <Ionicons
              name="alert-circle-outline"
              size={14}
              color="#EF4444"
            />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* ── Timer + resend ── */}
        <View style={styles.timerBlock}>
          {timer > 0 ? (
            <>
              <View style={styles.progressTrack}>
                <Animated.View
                  style={[
                    styles.progressBar,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>
              <Text style={styles.timerText}>
                {t('resendIn', language)}{' '}
                <Text style={styles.timerCount}>{timer}s</Text>
              </Text>
            </>
          ) : (
            <TouchableOpacity
              disabled={resendLoading}
              style={styles.resendBtn}
              activeOpacity={0.75}
              onPress={handleResendOtp}>
              <Ionicons
                name="refresh-outline"
                size={15}
                color={colors.primary}
              />
              <Text style={styles.resendText}>
                {resendLoading
                  ? t('sendingOtp', language)
                  : t('resendOtp', language)}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Verify button ── */}
        <TouchableOpacity
          style={[
            styles.button,
            (!isValid || loading) && styles.disabledButton,
          ]}
          disabled={!isValid || loading}
          activeOpacity={0.85}
          onPress={handleVerifyOtp}>
          {!loading && (
            <Ionicons
              name="checkmark-circle-outline"
              size={18}
              color="#FFFFFF"
              style={styles.buttonIcon}
            />
          )}
          <Text style={styles.buttonText}>
            {loading
              ? t('verifying', language)
              : t('verifyOtp', language)}
          </Text>
        </TouchableOpacity>

      </View>
    </KeyboardAvoidingView>
  );
};

export default OtpScreen;

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({

  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  sheet: {
    backgroundColor: colors.card,
    height: '68%',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: {width: 0, height: -5},
    elevation: 10,
  },

  // ── Handle ────────────────────────────────
  handle: {
    width: 44,
    height: 4,
    borderRadius: 10,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 26,
  },

  // ── Header ────────────────────────────────
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },

  otpIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: `${colors.primary}1A`,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
  },

  headerTextBlock: {
    flex: 1,
  },

  title: {
    fontSize: 24,
    color: colors.textPrimary,
    letterSpacing: -0.4,
    fontFamily: Fonts.bold,
  },

  subtitle: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: Fonts.regular,
  },

  // ── Phone row ─────────────────────────────
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },

  phonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: `${colors.primary}1A`,
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },

  phone: {
    fontSize: 15,
    color: colors.primary,
    fontFamily: Fonts.semiBold,
    letterSpacing: 0.3,
  },

  changeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },

  changeBtnText: {
    color: colors.textSecondary,
    fontFamily: Fonts.semiBold,
    fontSize: 12,
  },

  // ── OTP dots ──────────────────────────────
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 8,
  },

  otpDot: {
    width: 46,
    height: 54,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },

  otpDotFilled: {
    backgroundColor: `${colors.primary}1A`,
    borderColor: colors.primary,
  },

  otpDotActive: {
    borderColor: colors.primary,
    backgroundColor: colors.card,
    shadowColor: '#2563EB',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 2},
    elevation: 3,
  },

  otpDotError: {
    borderColor: '#FCA5A5',
    backgroundColor: 'rgba(239,68,68,0.08)',
  },

  otpDotText: {
    fontSize: 20,
    color: colors.textPrimary,
    fontFamily: Fonts.bold,
    letterSpacing: 0,
  },

  cursor: {
    width: 2,
    height: 22,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },

  hiddenInput: {
    position: 'absolute',
    width: '100%',
    height: 54,
    opacity: 0,
  },

  // ── Error ─────────────────────────────────
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 4,
  },

  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontFamily: Fonts.medium,
  },

  // ── Timer / resend ────────────────────────
  timerBlock: {
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 4,
    gap: 8,
  },

  progressTrack: {
    width: '60%',
    height: 3,
    borderRadius: 4,
    backgroundColor: colors.backgroundSecondary,
    overflow: 'hidden',
  },

  progressBar: {
    height: 3,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },

  timerText: {
    color: colors.textHint,
    fontFamily: Fonts.regular,
    fontSize: 13,
  },

  timerCount: {
    color: colors.primary,
    fontFamily: Fonts.semiBold,
  },

  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${colors.primary}1A`,
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
  },

  resendText: {
    color: colors.primary,
    fontFamily: Fonts.semiBold,
    fontSize: 14,
  },

  // ── Button ────────────────────────────────
  button: {
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#2563EB',
    shadowOpacity: 0.32,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 5},
    elevation: 7,
  },

  disabledButton: {
    opacity: 0.45,
    shadowOpacity: 0,
    elevation: 0,
  },

  buttonIcon: {
    marginRight: 8,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    letterSpacing: 0.2,
    fontFamily: Fonts.semiBold,
  },
});
