import React, {useState} from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';

import {useBookingStore} from '../../store/bookingStore';

import {useAuthStore} from '../../store/authStore';

import {useLanguageStore} from '../../store/languageStore';

import {t} from '../../i18n';

import {Fonts} from '../../constants/fonts';

import {useTheme} from '../../hooks/useTheme';

import {getLocalizedText} from '../../utils/getLocalizedText';

import Ionicons from '@react-native-vector-icons/ionicons';

const timeSlots = [
  {
    label: '09:00 AM - 11:00 AM',
    startHour: 9,
    icon: 'sunny-outline',
  },
  {
    label: '11:00 AM - 01:00 PM',
    startHour: 11,
    icon: 'partly-sunny-outline',
  },
  {
    label: '01:00 PM - 03:00 PM',
    startHour: 13,
    icon: 'sunny-outline',
  },
  {
    label: '03:00 PM - 05:00 PM',
    startHour: 15,
    icon: 'partly-sunny-outline',
  },
  {
    label: '05:00 PM - 07:00 PM',
    startHour: 17,
    icon: 'moon-outline',
  },
];

const DAY_NAMES = {
  en: [
    'Sun',
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
  ],
  ar: [
    'الأحد',
    'الإثنين',
    'الثلاثاء',
    'الأربعاء',
    'الخميس',
    'الجمعة',
    'السبت',
  ],
};

const ScheduleScreen = ({navigation}: any) => {
const bookingDate =
  useBookingStore(
    state => state.selectedDate,
  );

const bookingSlot =
  useBookingStore(
    state => state.selectedTimeSlot,
  );

const [selectedDate, setDate] =
  useState(bookingDate);

const [selectedSlot, setSlot] =
  useState(bookingSlot);
  const [error, setError] = useState('');

  const isLoggedIn = useAuthStore(
    state => state.isLoggedIn,
  );

  const language = useLanguageStore(
    state => state.language,
  );

  const {colors} = useTheme();
  const styles = createStyles(colors);

  const saveDate = useBookingStore(
    state => state.setSelectedDate,
  );

  const saveSlot = useBookingStore(
    state => state.setSelectedTimeSlot,
  );

  const saveSlotStartHour = useBookingStore(
    state => state.setSelectedSlotStartHour,
  );

  const selectedPackage = useBookingStore(
    state => state.selectedPackage,
  );

  const dates = Array.from({length: 7}, (_, i) => {
    const d = new Date();

    d.setDate(d.getDate() + i);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

const displayDate =
  d.toLocaleDateString(
    language === 'ar'
      ? 'ar-SA'
      : 'en-US',
    {
      day: 'numeric',
      month: 'short',
    },
  );

    return {
      label:
        i === 0
          ? t('today', language)
          : i === 1
          ? t('tomorrow', language)
          : displayDate,

      dayName:
  DAY_NAMES[language][
    d.getDay()
  ],

      displayDate,

      dayNum: d.getDate(),

      value: `${year}-${month}-${day}`,
    };
  });

  const isSlotDisabled = (slotHour: number) => {
    if (!selectedDate) {
      return false;
    }

    const today = new Date();
    const selected = new Date(selectedDate);
    const isToday =
      selected.toDateString() === today.toDateString();

    if (!isToday) {
      return false;
    }

    return slotHour <= today.getHours();
  };

  const handleContinue = () => {
    if (!selectedDate || !selectedSlot) {
  setError(
    t(
      'pleaseSelectDateTime',
      language,
    ),
  );
  return;
}

    const matchedSlot = timeSlots.find(
      slot => slot.label === selectedSlot,
    );

    saveDate(selectedDate);
    saveSlot(selectedSlot);
    saveSlotStartHour(matchedSlot ? matchedSlot.startHour : null);

    if (!isLoggedIn) {
      navigation.navigate('Login', {
        redirectTo: 'Address',
      });
      return;
    }

    navigation.navigate('Address');
  };

  return (
    <View style={styles.root}>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        <View style={styles.inner}>

          {/* ── Header ── */}
          <View style={styles.headerContainer}>
            <View style={styles.topRow}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
                activeOpacity={0.7}>
                <Ionicons
                  name={
                    language === 'ar'
                      ? 'chevron-forward'
                      : 'chevron-back'
                  }
                  size={22}
                  color={colors.textPrimary}
                />
              </TouchableOpacity>

              <View style={styles.headerTextBlock}>
                <Text style={styles.heading}>
                  {t('scheduleVisit', language)}
                </Text>
                <Text style={styles.subtitle}>
                  {t('scheduleSubtitle', language)}
                </Text>
              </View>
            </View>
          </View>

          {/* ── Package Card ── */}
          {selectedPackage && (
            <View style={styles.packageCard}>
              <View style={styles.packageCardTop}>
                <View style={styles.packageBadge}>
                  <Ionicons
                    name="cube-outline"
                    size={12}
                    color={colors.primary}
                  />
                  <Text style={styles.packageBadgeText}>
              {t('selectedPackage', language)}
                  </Text>
                </View>

                <View style={styles.packagePricePill}>
<Text style={styles.packagePrice}>
  {t('currency', language)}{' '}
  {selectedPackage?.offerPrice}
</Text>
                </View>
              </View>

             <Text style={styles.packageLabel}>
  {getLocalizedText(selectedPackage?.name, language)}
</Text>
            </View>
          )}

          {/* ── Date Section ── */}
          <Text style={styles.sectionLabel}>
            {t('selectDate', language)}
          </Text>

        </View>

        {/* Horizontal date strip — full bleed */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateStrip}>
          {dates.map(date => {
            const active = selectedDate === date.value;
            return (
              <TouchableOpacity
                key={date.value}
                style={[
                  styles.dateCard,
                  active && styles.dateCardActive,
                ]}
                activeOpacity={0.75}
onPress={() => {
  setDate(date.value);

  if (error) {
    setError('');
  }
}}>
                <Text
                  style={[
                    styles.dateDayName,
                    active && styles.dateDayNameActive,
                  ]}>
                  {date.dayName}
                </Text>

                <Text
                  style={[
                    styles.dateNum,
                    active && styles.dateNumActive,
                  ]}>
                  {date.dayNum}
                </Text>

                <Text
                  style={[
                    styles.dateLabel,
                    active && styles.dateLabelActive,
                  ]}>
                  {date.label}
                </Text>

                {active && (
                  <View style={styles.dateDot} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.inner}>

          {/* ── Time Slot Section ── */}
          <Text style={[styles.sectionLabel, styles.sectionLabelTop]}>
            {t('selectTime', language)}
          </Text>

          {timeSlots.map(slot => {
            const disabled = isSlotDisabled(slot.startHour);
            const active = selectedSlot === slot.label;

            return (
              <TouchableOpacity
                key={slot.label}
                disabled={disabled}
                style={[
                  styles.slotCard,
                  active && styles.slotCardActive,
                  disabled && styles.slotCardDisabled,
                ]}
                activeOpacity={0.75}
               onPress={() => {
  setSlot(slot.label);

  if (error) {
    setError('');
  }
}}>

                <View style={[
                  styles.slotIconWrap,
                  active && styles.slotIconWrapActive,
                  disabled && styles.slotIconWrapDisabled,
                ]}>
                  <Ionicons
                    name={slot.icon as any}
                    size={18}
                    color={
                      disabled
                        ? '#CBD5E1'
                        : active
                        ? colors.primary
                        : colors.textSecondary
                    }
                  />
                </View>

                <Text
                  style={[
                    styles.slotText,
                    active && styles.slotTextActive,
                    disabled && styles.slotTextDisabled,
                  ]}>
                  {slot.label}
                </Text>

                {disabled ? (
                  <View style={styles.slotUnavailablePill}>
                    <Text style={styles.slotUnavailableText}>
                      {t('notAvailable', language)}
                    </Text>
                  </View>
                ) : active ? (
                  <View style={styles.slotCheckWrap}>
                    <Ionicons
                      name="checkmark"
                      size={14}
                      color="#FFFFFF"
                    />
                  </View>
                ) : (
                  <View style={styles.slotRadioEmpty} />
                )}

              </TouchableOpacity>
            );
          })}

          {/* Error */}
          {error ? (
            <View style={styles.errorRow}>
              <Ionicons
                name="alert-circle-outline"
                size={15}
                color="#EF4444"
              />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

        </View>
      </ScrollView>

      {/* ── Sticky Footer ── */}
      <View style={styles.stickyFooter}>

        <View style={styles.footerLeft}>
          <Text style={styles.footerLabel}>
            {t('selectedSlot', language)}
          </Text>

          <Text style={styles.footerDate}>
            {selectedDate
              ? dates.find(d => d.value === selectedDate)?.label
              : t('selectDate', language)}
          </Text>

          <Text style={styles.footerTime}>
            {selectedSlot
              ? selectedSlot
              : t('selectTime', language)}
          </Text>
        </View>

        <TouchableOpacity
          disabled={!selectedDate || !selectedSlot}
          style={[
            styles.footerButton,
            (!selectedDate || !selectedSlot) &&
              styles.footerButtonDisabled,
          ]}
          activeOpacity={0.85}
          onPress={handleContinue}>
          <Text style={styles.footerButtonText}>
            {t('continue', language)}
          </Text>
          <Ionicons
            name={
              language === 'ar'
                ? 'arrow-back'
                : 'arrow-forward'
            }
            size={18}
            color="#FFFFFF"
            style={styles.footerButtonIcon}
          />
        </TouchableOpacity>

      </View>

    </View>
  );
};

export default ScheduleScreen;

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({

  root: {
    flex: 1,
  },

  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scrollContent: {
    paddingBottom: 140,
  },

  inner: {
    paddingHorizontal: 20,
  },

  // ── Header ──────────────────────────────
  headerContainer: {
    marginTop: 45,
    marginBottom: 22,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

  headerTextBlock: {
    flex: 1,
  },

  heading: {
    fontSize: 26,
    color: colors.textPrimary,
    fontFamily: Fonts.bold,
    letterSpacing: -0.5,
  },

  subtitle: {
    marginTop: 3,
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: Fonts.regular,
    lineHeight: 18,
  },

  // ── Package Card ─────────────────────────
  packageCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 26,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#64748B',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 4},
    elevation: 3,
  },

  packageCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  packageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },

  packageBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontFamily: Fonts.semiBold,
  },

  packagePricePill: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },

  packagePrice: {
    color: colors.primary,
    fontSize: 15,
    fontFamily: Fonts.bold,
  },

  packageLabel: {
    fontSize: 16,
    color: colors.textPrimary,
    fontFamily: Fonts.semiBold,
    lineHeight: 22,
  },

  // ── Section Labels ───────────────────────
  sectionLabel: {
    fontSize: 17,
    color: colors.textPrimary,
    fontFamily: Fonts.bold,
    marginBottom: 14,
    letterSpacing: -0.2,
  },

  sectionLabelTop: {
    marginTop: 28,
  },

  // ── Date Strip ───────────────────────────
  dateStrip: {
    paddingHorizontal: 20,
    paddingBottom: 4,
    gap: 10,
  },

  dateCard: {
    width: 72,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: '#64748B',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 2},
    elevation: 2,
  },

  dateCardActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: '#2563EB',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },

  dateDayName: {
    fontSize: 11,
    color: colors.textHint,
    fontFamily: Fonts.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  dateDayNameActive: {
    color: 'rgba(255,255,255,0.75)',
  },

  dateNum: {
    fontSize: 22,
    color: colors.textPrimary,
    fontFamily: Fonts.bold,
    marginTop: 4,
    lineHeight: 26,
  },

  dateNumActive: {
    color: '#FFFFFF',
  },

  dateLabel: {
    fontSize: 10,
    color: colors.textHint,
    fontFamily: Fonts.medium,
    marginTop: 3,
  },

  dateLabelActive: {
    color: 'rgba(255,255,255,0.7)',
  },

  dateDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.8)',
    marginTop: 6,
  },

  // ── Slot Cards ───────────────────────────
  slotCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#64748B',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 2},
    elevation: 2,
  },

  slotCardActive: {
    borderWidth: 2,
    backgroundColor: colors.selectedCardBackground,
    borderColor: colors.primary,
  },

  slotCardDisabled: {
    opacity: 0.45,
  },

  slotIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

  slotIconWrapActive: {
    backgroundColor: '#EEF2FF',
  },

  slotIconWrapDisabled: {
    backgroundColor: colors.background,
  },

  slotText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: Fonts.medium,
  },

  slotTextActive: {
    color: colors.primary,
    fontFamily: Fonts.semiBold,
  },

  slotTextDisabled: {
    color: colors.textHint,
  },

  slotCheckWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

  slotRadioEmpty: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.border,
    flexShrink: 0,
  },

  slotUnavailablePill: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },

  slotUnavailableText: {
    fontSize: 11,
    color: '#EF4444',
    fontFamily: Fonts.medium,
  },

  // ── Error ────────────────────────────────
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },

  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontFamily: Fonts.medium,
  },

  // ── Sticky Footer ────────────────────────
  stickyFooter: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 14,
    paddingLeft: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#1E293B',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: {width: 0, height: 8},
    elevation: 12,
  },

  footerLeft: {
    flex: 1,
    marginRight: 12,
  },

  footerLabel: {
    color: colors.textHint,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: Fonts.medium,
  },

  footerDate: {
    fontSize: 15,
    color: colors.textPrimary,
    fontFamily: Fonts.semiBold,
    marginTop: 3,
  },

  footerTime: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },

  footerButton: {
    backgroundColor: colors.primary,
    height: 50,
    paddingHorizontal: 22,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 4},
    elevation: 6,
  },

  footerButtonDisabled: {
    opacity: 0.45,
    shadowOpacity: 0,
    elevation: 0,
  },

  footerButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: Fonts.semiBold,
  },

  footerButtonIcon: {
    marginLeft: 6,
  },
});
