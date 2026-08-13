import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

import StatusBadge from './StatusBadge';
import {Fonts} from '../../constants/fonts';

import {
  useLanguageStore,
} from '../../store/languageStore';

import {useTheme} from '../../hooks/useTheme';

import {t} from '../../i18n';

interface Props {
  booking: any;
  onPress: () => void;
}

const BookingCard = ({
  booking,
  onPress,
}: Props) => {
  const language =
  useLanguageStore(
    state => state.language,
  );

  const {colors} = useTheme();
  const styles = createStyles(colors);

const serviceName =
  typeof booking.service?.name ===
  'object'
    ? language === 'ar'
      ? booking.service?.name?.ar
      : booking.service?.name?.en
    : booking.service?.name;
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={styles.card}>
      
      <View style={styles.topRow}>
<Text
  numberOfLines={1}
  style={styles.service}>
  {serviceName}
</Text>
        <StatusBadge
          status={booking.status}
        />
      </View>

<Text style={styles.bookingId}>
  {t('bookingNumber', language)} #{booking.bookingNumber}
</Text>

      <View style={styles.infoRow}>
        <Text style={styles.info}>
          📅{' '}
          {new Date(booking.bookingDate).toLocaleDateString(
  language === 'ar' ? 'ar-SA' : 'en-US',
  {timeZone: 'Asia/Riyadh'},
)}
        </Text>

<Text style={styles.info}>
  {t('currency', language)} {booking.finalAmount ?? booking.totalAmount}
</Text>
      </View>

      <View style={styles.bottomRow}>
<Text style={styles.viewDetails}>
  {language === 'ar'
    ? `← ${t('viewDetails', language)}`
    : `${t('viewDetails', language)} →`}
</Text>
      </View>
    </TouchableOpacity>
  );
};

export default BookingCard;

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  card: {
    backgroundColor: colors.card,

    borderRadius: 22,

    padding: 18,

    marginBottom: 16,

    shadowColor: '#000',

    shadowOpacity: 0.05,

    shadowRadius: 10,

    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 4,
  },

  topRow: {
    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',
  },

  service: {
    flex: 1,

    fontSize: 18,

    color: colors.textPrimary,

    fontFamily: Fonts.bold,

    marginRight: 10,
  },

  bookingId: {
    marginTop: 12,

    color: colors.textSecondary,

    fontFamily: Fonts.medium,

    fontSize: 13,
  },

  infoRow: {
    marginTop: 16,

    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',
  },

  info: {
    color: '#475569',

    fontFamily: Fonts.medium,
  },

  bottomRow: {
    marginTop: 20,

    alignItems: 'flex-end',
  },

  viewDetails: {
    color: '#4757E7',

    fontSize: 14,

    fontFamily: Fonts.semiBold,
  },
});