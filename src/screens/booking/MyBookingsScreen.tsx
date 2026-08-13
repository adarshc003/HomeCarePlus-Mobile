import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';

import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  AppState,
  Animated,
  TouchableOpacity,
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
import BookingCardSkeleton from '../../components/booking/BookingCardSkeleton';

import {RootStackParamList} from '../../navigation/types';

import {useBookingStore} from '../../store/bookingStore';
import {useAuthStore} from '../../store/authStore';

import Ionicons from '@react-native-vector-icons/ionicons';

const SKELETON_COUNT = 6;

type BookingFilter = 'all' | 'active' | 'completed' | 'cancelled';

const FILTERS: {key: BookingFilter; labelKey: string}[] = [
  {key: 'all', labelKey: 'filterAll'},
  {key: 'active', labelKey: 'filterActive'},
  {key: 'completed', labelKey: 'filterCompleted'},
  {key: 'cancelled', labelKey: 'filterCancelled'},
];

// Mobile has no "upcoming" bucket like the website's My Bookings tabs —
// anything not completed/cancelled (pending, assigned, travelling,
// in_progress, etc.) is simply "active" here.
const getFilterBucket = (status?: string | null): BookingFilter => {
  if (status === 'completed') return 'completed';
  if (status === 'cancelled') return 'cancelled';
  return 'active';
};

const MyBookingsScreen = () => {

  const bookings = useBookingStore(
    state => state.bookings,
  );
  const setBookings = useBookingStore(
    state => state.setBookings,
  );

  const isLoggedIn = useAuthStore(
    state => state.isLoggedIn,
  );

  // Only the very first ever load (no cached bookings yet, in-memory store
  // is empty because the app just started, or this session never fetched
  // them) shows the skeleton — a screen revisit within the same session
  // already has `bookings` populated, so this starts `false` and the real
  // list renders immediately while a silent background refetch runs.
  const [loading, setLoading] = useState(bookings.length === 0);

  const [refreshing, setRefreshing] = useState(false);

  const [loadError, setLoadError] = useState(false);

  const [activeFilter, setActiveFilter] = useState<BookingFilter>('all');

  // Fades the real list in the first time it replaces the skeleton. Starts
  // already-opaque when there's cached data, so a warm revisit never
  // plays an unnecessary fade.
  const contentOpacity = useRef(
    new Animated.Value(bookings.length > 0 ? 1 : 0),
  ).current;

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
    // A guest (fresh install, or right after logout) reaching this tab
    // previously still fired this fetch — the backend correctly rejects
    // it with 401, but that rendered as "Could not load bookings",
    // indistinguishable from a real backend outage. Skip the fetch
    // entirely instead; the empty state below shows a login prompt.
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }

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

  // useFocusEffect already covers the first mount (a screen's initial
  // focus fires immediately after it), so a separate mount-time useEffect
  // calling the same loadBookings() only ever duplicated that first fetch.
  useFocusEffect(
    useCallback(() => {
      loadBookings();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoggedIn]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        loadBookings();
      }
    });

    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  // Only plays when transitioning away from the true first-load skeleton —
  // contentOpacity already starts at 1 when there's cached data, so this is
  // a harmless no-op (1 → 1) on every subsequent refresh/refocus.
  useEffect(() => {
    if (!loading) {
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, contentOpacity]);

  const showSkeleton = loading && bookings.length === 0;

  const filteredBookings =
    activeFilter === 'all'
      ? bookings
      : bookings.filter(
          item => getFilterBucket(item.status) === activeFilter,
        );

  // ── Empty state ───────────────────────────────────────────────────────────
  const EmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <Ionicons
          name={
            !isLoggedIn
              ? 'log-in-outline'
              : loadError
              ? 'cloud-offline-outline'
              : 'document-text-outline'
          }
          size={48}
          color="#4757E7"
        />
      </View>

      <Text style={styles.emptyTitle}>
        {!isLoggedIn
          ? t('loginToViewBookings', language)
          : loadError
          ? t('couldNotLoadBookings', language)
          : t('noBookingsYet', language)}
      </Text>

      <Text style={styles.emptyText}>
        {!isLoggedIn
          ? t('loginToViewBookingsDesc', language)
          : loadError
          ? t('couldNotLoadBookingsDesc', language)
          : t('noBookingsDesc', language)}
      </Text>

      {!isLoggedIn && (
        <TouchableOpacity
          style={styles.loginButton}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginButtonText}>
            {t('login', language)}
          </Text>
        </TouchableOpacity>
      )}
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

      {/* ── Filters ── */}
      {bookings.length > 0 && (
        <View style={styles.filterRow}>
          {FILTERS.map(filter => {
            const isActive = activeFilter === filter.key;
            return (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterChip,
                  isActive && styles.filterChipActive,
                ]}
                activeOpacity={0.8}
                onPress={() => setActiveFilter(filter.key)}>
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && styles.filterChipTextActive,
                  ]}>
                  {t(filter.labelKey, language)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* ── List ── */}
      {showSkeleton ? (
        <View style={styles.listContent}>
          {Array.from({length: SKELETON_COUNT}).map((_, index) => (
            <BookingCardSkeleton key={index} />
          ))}
        </View>
      ) : (
        <Animated.View style={{flex: 1, opacity: contentOpacity}}>
          <FlatList
            data={filteredBookings}
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
              filteredBookings.length === 0
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
        </Animated.View>
      )}

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

  // ── Filters ───────────────────────────────────────────────────────────────
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 16,
  },

  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },

  filterChipActive: {
    backgroundColor: '#4757E7',
    borderColor: '#4757E7',
  },

  filterChipText: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: colors.textSecondary,
  },

  filterChipTextActive: {
    fontFamily: Fonts.semiBold,
    color: '#FFFFFF',
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

  loginButton: {
    marginTop: 20,
    backgroundColor: colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 20,
  },

  loginButtonText: {
    color: '#FFFFFF',
    fontFamily: Fonts.semiBold,
    fontSize: 14,
  },
});
