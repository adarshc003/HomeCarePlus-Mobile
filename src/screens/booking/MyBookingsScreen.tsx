import React, {
  useEffect,
  useState,
  useCallback,
} from 'react';

import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  AppState,
} from 'react-native';

import {
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';

import {NativeStackNavigationProp} from '@react-navigation/native-stack';

import {getBookings} from '../../services/bookingService';

import {useLanguageStore} from '../../store/languageStore';

import {t} from '../../i18n';

import {Fonts} from '../../constants/fonts';

import {useTheme} from '../../hooks/useTheme';

import BookingCard from '../../components/booking/BookingCard';

import {RootStackParamList} from '../../navigation/types';

import {useBookingStore} from '../../store/bookingStore';

import Ionicons from '@react-native-vector-icons/ionicons';

const MyBookingsScreen = () => {

  const {bookings, setBookings} = useBookingStore();

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [loadError, setLoadError] = useState(false);

  const language = useLanguageStore(
    state => state.language,
  );

  const {colors} = useTheme();
  const styles = createStyles(colors);

  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList, 'MyBookings'>
    >();

  const loadBookings = async () => {
    try {
      const data = await getBookings();
      setBookings(data.bookings || []);
      setLoadError(false);
    } catch (error) {
      console.log(error);
      // A failed fetch must never look like "no bookings yet" — that's
      // indistinguishable from a real empty history and hides real outages.
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };

  useEffect(() => {
    loadBookings();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBookings();
    }, []),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        loadBookings();
      }
    });

    return () => subscription.remove();
  }, []);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <View style={styles.loaderCard}>
          <ActivityIndicator
            size="large"
            color="#4757E7"
          />
          <Text style={styles.loaderText}>
            {t('loadingBookings', language)}
          </Text>
        </View>
      </View>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  const EmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <Ionicons
          name={loadError ? 'cloud-offline-outline' : 'document-text-outline'}
          size={48}
          color="#4757E7"
        />
      </View>

      <Text style={styles.emptyTitle}>
        {loadError
          ? t('couldNotLoadBookings', language)
          : t('noBookingsYet', language)}
      </Text>

      <Text style={styles.emptyText}>
        {loadError
          ? t('couldNotLoadBookingsDesc', language)
          : t('noBookingsDesc', language)}
      </Text>
    </View>
  );

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>

      {/* ── Header ── */}
      <View style={styles.headerSection}>
        <View style={styles.smallLabelRow}>
          <View style={styles.smallLabelDot} />
          <Text style={styles.smallLabel}>
            {t('bookingHistory', language)}
          </Text>
        </View>

        <Text style={styles.heading}>
          {t('myBookings', language)}
        </Text>

        <Text style={styles.subHeading}>
          {t('manageBookingsSubtitle', language)}
        </Text>

        {bookings.length > 0 && (
          <View style={styles.countRow}>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>
                {bookings.length}
              </Text>
            </View>
            <Text style={styles.countLabel}>
              {t('bookingsCount', language)}
            </Text>
          </View>
        )}
      </View>

      {/* ── List ── */}
      <FlatList
        data={bookings}
        keyExtractor={item => item.bookingNumber ?? item._id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4757E7"
            colors={['#4757E7']}
          />
        }
        contentContainerStyle={
          bookings.length === 0
            ? styles.listEmpty
            : styles.listContent
        }
        ListEmptyComponent={<EmptyComponent />}
        renderItem={({item}) => (
          <BookingCard
            booking={item}
            onPress={() =>
              navigation.navigate('BookingDetails', {
                bookingNumber: item.bookingNumber,
              })
            }
          />
        )}
      />

    </View>
  );
};

export default MyBookingsScreen;

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 50,
  },

  // ── Loader ────────────────────────────────────────────────────────────────
  loaderContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },

  loaderCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    paddingVertical: 40,
    paddingHorizontal: 48,
    alignItems: 'center',
    gap: 16,
    shadowColor: '#64748B',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: {width: 0, height: 6},
    elevation: 5,
  },

  loaderText: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: colors.textSecondary,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  headerSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },

  smallLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },

  smallLabelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4757E7',
  },

  smallLabel: {
    fontSize: 11,
    color: '#4757E7',
    fontFamily: Fonts.semiBold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  heading: {
    fontSize: 28,
    color: colors.textPrimary,
    fontFamily: Fonts.bold,
    letterSpacing: -0.5,
  },

  subHeading: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
    fontFamily: Fonts.regular,
  },

  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 12,
  },

  countBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },

  countText: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: '#4757E7',
  },

  countLabel: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
  },

  // ── List ──────────────────────────────────────────────────────────────────
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    paddingTop: 4,
  },

  listEmpty: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  // ── Empty state ───────────────────────────────────────────────────────────
  emptyContainer: {
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 36,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#64748B',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 4},
    elevation: 3,
  },

  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 26,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },

  emptyTitle: {
    fontSize: 20,
    color: colors.textPrimary,
    fontFamily: Fonts.bold,
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: -0.2,
  },

  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: Fonts.regular,
    fontSize: 14,
  },
});
