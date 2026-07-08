import React, {
  useEffect,
  useRef,
} from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';

import {useLanguageStore} from '../../store/languageStore';

import {t} from '../../i18n';

import {Fonts} from '../../constants/fonts';

import {useTheme} from '../../hooks/useTheme';

import Ionicons from '@react-native-vector-icons/ionicons';

import {useBookingStore} from '../../store/bookingStore';
import {useOfferStore} from '../../store/offerStore';
import {useAppDataStore} from '../../store/appDataStore';

const BookingSuccessScreen = ({
  navigation,
  route,
}: any) => {

  const language =
    useLanguageStore(
      state => state.language,
    );

  const {colors} = useTheme();
  const styles = createStyles(colors);

  const paymentMethod =
    route?.params?.paymentMethod || 'COD';

  const paymentStatus =
    route?.params?.paymentStatus || 'PENDING';

  // ── Animations ────────────────────────────────────────────────────────────

  const scaleAnim =
    useRef(new Animated.Value(0)).current;

  const fadeAnim =
    useRef(new Animated.Value(0)).current;

  const slideAnim =
    useRef(new Animated.Value(40)).current;

  const ringAnim =
    useRef(new Animated.Value(1)).current;

const clearBooking =
  useBookingStore(state => state.clearBooking);

const clearOffer =
  useOfferStore(state => state.clearOffer);

const clearOffers =
  useAppDataStore(state => state.clearOffers);

  useEffect(() => {
    // 1. Pop in the check circle
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 80,
      useNativeDriver: true,
    }).start();

    // 2. Fade + slide up the text block with a slight delay
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 480,
        delay: 220,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 420,
        delay: 220,
        useNativeDriver: true,
      }),
    ]).start();

    // 3. Pulse ring — single breathe
    Animated.sequence([
      Animated.delay(400),
      Animated.timing(ringAnim, {
        toValue: 1.18,
        duration: 340,
        useNativeDriver: true,
      }),
      Animated.timing(ringAnim, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const isPaid = paymentStatus === 'PAID';
  const isCOD = paymentMethod === 'COD';

  const paymentMethodText =
  paymentMethod === 'COD'
    ? t('cashOnDelivery', language)
    : t('onlinePayment', language);

const paymentStatusText =
  paymentStatus === 'PAID'
    ? t('paid', language)
    : paymentStatus === 'PENDING'
    ? t('pending', language)
    : paymentStatus === 'FAILED'
    ? t('failed', language)
    : paymentStatus;

  const methodIcon =
    isCOD ? 'cash-outline' : 'card-outline';

  const statusColor =
    isPaid ? colors.success : colors.warning;

  const statusBg =
    isPaid ? '#F0FDF4' : '#FFFBEB';

  const statusBorder =
    isPaid ? '#BBF7D0' : '#FDE68A';

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>

      {/* ── Check icon with pulse ring ── */}
      <Animated.View
        style={[
          styles.ringOuter,
          {transform: [{scale: ringAnim}]},
        ]}>
        <Animated.View
          style={[
            styles.iconOuter,
            {transform: [{scale: scaleAnim}]},
          ]}>
          <View style={styles.iconContainer}>
            <Ionicons
              name="checkmark"
              size={46}
              color="#FFFFFF"
            />
          </View>
        </Animated.View>
      </Animated.View>

      {/* ── Text block (fades + slides up) ── */}
      <Animated.View
        style={[
          styles.textBlock,
          {
            opacity: fadeAnim,
            transform: [{translateY: slideAnim}],
          },
        ]}>

        <View style={styles.successTagWrap}>
          <Ionicons
            name="checkmark-circle"
            size={13}
            color={colors.success}
          />
          <Text style={styles.successTag}>
            {t('bookingConfirmedTag', language)}
          </Text>
        </View>

        <Text style={styles.title}>
          {t('bookingConfirmed', language)}
        </Text>

        <Text style={styles.subtitle}>
          {t('bookingSuccessSubtitle', language)}
        </Text>

        <Text style={styles.description}>
          {t('bookingSuccessDescription', language)}
        </Text>

        {/* ── Payment card ── */}
        <View style={styles.paymentCard}>

          <View style={styles.paymentCardHeader}>
            <View style={styles.paymentCardIconWrap}>
              <Ionicons
                name="receipt-outline"
                size={16}
                color="#4757E7"
              />
            </View>
            <Text style={styles.paymentTitle}>
              {t('paymentDetails', language)}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Method row */}
          <View style={styles.paymentRow}>
            <View style={styles.paymentRowLeft}>
              <View style={styles.rowIconWrap}>
                <Ionicons
                  name={methodIcon}
                  size={14}
                  color={colors.textSecondary}
                />
              </View>
              <Text style={styles.label}>
                {t('paymentMethod', language)}
              </Text>
            </View>
<Text style={styles.value}>
  {paymentMethodText}
</Text>
          </View>

          {/* Status row */}
          <View style={styles.paymentRow}>
            <View style={styles.paymentRowLeft}>
              <View style={styles.rowIconWrap}>
                <Ionicons
                  name={
                    isPaid
                      ? 'checkmark-circle-outline'
                      : 'time-outline'
                  }
                  size={14}
                  color={colors.textSecondary}
                />
              </View>
              <Text style={styles.label}>
                {t('paymentStatus', language)}
              </Text>
            </View>

            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor: statusBg,
                  borderColor: statusBorder,
                },
              ]}>
              <View
                style={[
                  styles.statusDot,
                  {backgroundColor: statusColor},
                ]}
              />
<Text
  style={[
    styles.statusText,
    {color: statusColor},
  ]}>
  {paymentStatusText}
</Text>
            </View>
          </View>

        </View>

      </Animated.View>

      {/* ── Back to home ── */}
      <TouchableOpacity
        activeOpacity={0.75}
        style={styles.homeBtn}
        onPress={() => {

  clearBooking();

  clearOffer();

  clearOffers();

  navigation.navigate('Home');

}}>
        <Ionicons
          name={
            language === 'ar'
              ? 'arrow-forward'
              : 'arrow-back'
          }
          size={16}
          color={colors.primary}
        />
        <Text style={styles.homeBtnText}>
          {t('backToHome', language)}
        </Text>
      </TouchableOpacity>

    </View>
  );
};

export default BookingSuccessScreen;

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
    paddingTop: 80,
    alignItems: 'center',
  },

  // ── Icon ──────────────────────────────────────────────────────────────────
  ringOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(34,197,94,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },

  iconOuter: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },

  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOpacity: 0.38,
    shadowRadius: 16,
    shadowOffset: {width: 0, height: 6},
    elevation: 10,
  },

  // ── Text block ────────────────────────────────────────────────────────────
  textBlock: {
    width: '100%',
    alignItems: 'center',
  },

  successTagWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 14,
  },

  successTag: {
    color: colors.success,
    fontSize: 11,
    letterSpacing: 1.5,
    fontFamily: Fonts.semiBold,
  },

  title: {
    fontSize: 30,
    color: colors.textPrimary,
    textAlign: 'center',
    fontFamily: Fonts.bold,
    letterSpacing: -0.5,
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: Fonts.medium,
  },

  description: {
    fontSize: 13,
    color: colors.textHint,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    fontFamily: Fonts.regular,
  },

  // ── Payment card ──────────────────────────────────────────────────────────
  paymentCard: {
    marginTop: 28,
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#64748B',
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 6},
    elevation: 4,
  },

  paymentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },

  paymentCardIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  paymentTitle: {
    fontSize: 16,
    color: colors.textPrimary,
    fontFamily: Fonts.bold,
    letterSpacing: -0.1,
  },

  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginBottom: 14,
  },

  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  paymentRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  rowIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },

  label: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: Fonts.regular,
  },

  value: {
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },

  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  statusText: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
  },

  // ── Back to home ──────────────────────────────────────────────────────────
  homeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 'auto',
    marginBottom: 36,
    backgroundColor: `${colors.primary}1A`,
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },

  homeBtnText: {
    color: colors.primary,
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },

});
