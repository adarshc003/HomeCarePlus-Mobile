import React, {
  useState,
  useRef,
  useEffect,
} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
} from 'react-native';

import {sendOTP} from '../../services/firebaseAuth';
import {
  showSuccess,
  showError,
} from '../../utils/showToast';

import {useLanguageStore} from '../../store/languageStore';

import {t} from '../../i18n';
import {Fonts} from '../../constants/fonts';

import Ionicons from '@react-native-vector-icons/ionicons';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  PHONE_COUNTRIES as COUNTRIES,
  isValidPhoneForCountry,
} from '../../utils/phoneValidation';

const LoginScreen = ({
  navigation,
  route,
}: any) => {
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(false);
  const [hasLoggedIn, setHasLoggedIn] = useState(false);

  const language = useLanguageStore(
    state => state.language,
  );

  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const checkLogin = async () => {
      const value = await AsyncStorage.getItem('hasLoggedIn');
      setHasLoggedIn(value === 'true');
    };

    checkLogin();
  }, []);

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {toValue: 8,  duration: 60, useNativeDriver: true}),
      Animated.timing(shakeAnim, {toValue: -8, duration: 60, useNativeDriver: true}),
      Animated.timing(shakeAnim, {toValue: 6,  duration: 60, useNativeDriver: true}),
      Animated.timing(shakeAnim, {toValue: -6, duration: 60, useNativeDriver: true}),
      Animated.timing(shakeAnim, {toValue: 0,  duration: 60, useNativeDriver: true}),
    ]).start();
  };

  const handleSendOtp = async () => {
    if (!phone.trim()) {
      setError(t('phoneNumberRequired', language));
      triggerShake();
      return;
    }

    if (!isValidPhoneForCountry(phone, country)) {
      setError(
        `${t('enterValidPhone', language)} ${country.maxLength} ${t('digitPhoneNumber', language)}`,
      );
      triggerShake();
      return;
    }

    setError('');

    try {
      setLoading(true);

      const confirmation = await sendOTP(`${country.code}${phone}`);

      showSuccess(t('otpSentTitle', language), t('checkYourPhone', language));

      navigation.navigate('Otp', {
        phone: `${country.code}${phone}`,
        confirmation,
        redirectTo: route?.params?.redirectTo,
      });
    } catch (error: any) {
      console.log(error);

      setError(error?.message || t('failedToSendOtp', language));

      showError(t('failed', language), t('unableToSendOtp', language));
    } finally {
      setLoading(false);
    }
  };

  const isValid = isValidPhoneForCountry(phone, country);

  return (
    <View style={styles.overlay}>
      <View style={styles.sheet}>

        {/* ── Drag handle ── */}
        <View style={styles.handle} />

        {/* ── Header ── */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}>
            <Ionicons
              name={
                language === 'ar'
                  ? 'chevron-forward'
                  : 'chevron-back'
              }
              size={20}
              color="#0F172A"
            />
          </TouchableOpacity>

          <View style={styles.headerTextBlock}>
            <Text style={styles.title}>
              {hasLoggedIn
                ? t('welcomeBack', language)
                : t('welcome', language)}
            </Text>
            <Text style={styles.subtitle}>
              {t('loginSubtitle', language)}
            </Text>
          </View>
        </View>

        {/* ── Phone input ── */}
        <Animated.View
          style={[
            styles.inputContainer,
            focused && styles.inputContainerFocused,
            error ? styles.inputContainerError : null,
            {transform: [{translateX: shakeAnim}]},
          ]}>

          <TouchableOpacity
            style={styles.countryWrap}
            activeOpacity={0.8}
            onPress={() => setShowCountryModal(true)}>
            <Text style={styles.country}>
              {country.flag} {country.code}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#64748B" />
            <View style={styles.countryDivider} />
          </TouchableOpacity>

          <TextInput
            placeholder={t('enterPhone', language)}
            placeholderTextColor="#CBD5E1"
            keyboardType="number-pad"
            maxLength={country.maxLength}
            value={phone}
            onChangeText={text => {
              setPhone(text);
              if (error) setError('');
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={styles.input}
          />

          {isValid && (
            <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
          )}

        </Animated.View>

        {/* ── Error ── */}
        {error ? (
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle-outline" size={14} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* ── CTA button ── */}
        <TouchableOpacity
          style={[
            styles.button,
            (!isValid || loading) && styles.disabledButton,
          ]}
          disabled={!isValid || loading}
          activeOpacity={0.85}
          onPress={handleSendOtp}>
          {!loading && (
            <Ionicons
              name="phone-portrait-outline"
              size={18}
              color="#FFFFFF"
              style={styles.buttonIcon}
            />
          )}
          <Text style={styles.buttonText}>
            {loading
              ? t('sendingOtp', language)
              : t('continue', language)}
          </Text>
        </TouchableOpacity>

        {/* ── Footer ── */}
        <View style={styles.footerRow}>
          <Ionicons name="shield-checkmark-outline" size={13} color="#94A3B8" />
          <Text style={styles.footer}>
            {t('secureOtpLogin', language)}
          </Text>
        </View>

        {/* ── Country modal ── */}
        <Modal
          transparent
          animationType="fade"
          visible={showCountryModal}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowCountryModal(false)}>
            <View style={styles.modalCard}>
              {COUNTRIES.map(item => (
                <TouchableOpacity
                  key={item.code}
                  style={styles.countryItem}
                  onPress={() => {
                    setCountry(item);
                    setPhone('');
                    setError('');
                    setShowCountryModal(false);
                  }}>
                  <Text style={styles.countryItemText}>
                    {item.flag} {t(item.nameKey, language)}
                  </Text>
                  <Text style={styles.countryCode}>
                    {item.code}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

      </View>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({

  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  sheet: {
    backgroundColor: '#FFFFFF',
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

  handle: {
    width: 44,
    height: 4,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 28,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 28,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexShrink: 0,
    marginTop: 2,
  },

  headerTextBlock: {
    flex: 1,
  },

  title: {
    fontSize: 28,
    fontFamily: Fonts.bold,
    color: '#0F172A',
    letterSpacing: -0.5,
  },

  subtitle: {
    marginTop: 4,
    color: '#64748B',
    fontSize: 13,
    lineHeight: 20,
    fontFamily: Fonts.regular,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    paddingHorizontal: 14,
    height: 60,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },

  inputContainerFocused: {
    borderColor: '#2563EB',
    backgroundColor: '#FFFFFF',
    shadowColor: '#2563EB',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 2},
    elevation: 3,
  },

  inputContainerError: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FFF5F5',
  },

  countryWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 4,
  },

  flagEmoji: {
    fontSize: 18,
  },

  country: {
    fontSize: 15,
    color: '#0F172A',
    fontFamily: Fonts.semiBold,
  },

  countryDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E2E8F0',
    marginLeft: 8,
    marginRight: 4,
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: '#0F172A',
    fontFamily: Fonts.medium,
    paddingVertical: 0,
    letterSpacing: 0.5,
  },

  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
    marginLeft: 2,
  },

  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontFamily: Fonts.medium,
  },

  button: {
    backgroundColor: '#2563EB',
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

  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    marginTop: 20,
  },

  footer: {
    color: '#94A3B8',
    fontSize: 12,
    fontFamily: Fonts.regular,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalCard: {
    width: '82%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    overflow: 'hidden',
  },

  countryItem: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },

  countryItemText: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: '#0F172A',
  },

  countryCode: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: '#64748B',
  },
});
