import React, {
  useEffect,
  useState,
  useCallback,
} from 'react';

import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  AppState,
  Linking,
  Modal,
  Image,
  TextInput,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';

import {SafeAreaView} from 'react-native-safe-area-context';

import {
  RouteProp,
  useFocusEffect,
} from '@react-navigation/native';

import {RootStackParamList} from '../../navigation/types';

import {Fonts} from '../../constants/fonts';

import {useTheme} from '../../hooks/useTheme';

import {useLanguageStore} from '../../store/languageStore';

import {t} from '../../i18n';

import {getLocalizedText} from '../../utils/getLocalizedText';

import StatusBadge from '../../components/booking/StatusBadge';
import SectionCard from '../../components/booking/SectionCard';
import DetailRow from '../../components/booking/DetailRow';

import BookingTimeline from '../../components/booking/BookingTimeline';

import {
  getBookingById,
  getInvoice,
  cancelBooking,
  submitReview,
} from '../../services/bookingService';

import {showSuccess, showError} from '../../utils/showToast';

import {showDialog} from '../../components/dialog/FeedbackDialog';

import StarRating from '../../components/review/StarRating';

import {
  createTamaraCheckout,
  verifyTamaraPayment,
  createTelrCheckout,
  verifyTelrPayment,
  pollPaymentStatus,
} from '../../services/paymentService';

import {InAppBrowser} from 'react-native-inappbrowser-reborn';

import VerificationModal from '../../components/modal/VerificationModal';

import {useBookingStore} from '../../store/bookingStore';

import Ionicons from '@react-native-vector-icons/ionicons';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Rotates a right-pointing chevron to point down when expanded (▶ → ▼) —
// mirrors ProfileScreen's collapsible-section chevron for a consistent feel.
const AnimatedChevron = ({
  expanded,
  color,
}: {
  expanded: boolean;
  color: string;
}) => {
  const rotateAnim = React.useRef(
    new Animated.Value(expanded ? 1 : 0),
  ).current;

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: expanded ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [expanded, rotateAnim]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  return (
    <Animated.View style={{transform: [{rotate}]}}>
      <Ionicons name="chevron-forward" size={16} color={color} />
    </Animated.View>
  );
};

type Props = {
  route: RouteProp<RootStackParamList, 'BookingDetails'>;
};

const BookingDetailsScreen = ({
  route,
  navigation,
}: any) => {

  // route.params is always supplied by every current caller, but nothing
  // enforces that (this screen is typed `any`) — guarding here prevents a
  // future deep-link/push-navigation path that omits it from crashing on
  // this destructure.
  const {bookingNumber} = route.params ?? {};

  const language = useLanguageStore(
    state => state.language,
  );

  const {colors} = useTheme();
  const styles = createStyles(colors);

  const updateBooking = useBookingStore(
    state => state.updateBooking,
  );

  const [booking, setBooking] = useState<any>(null);

  // Guards against out-of-order responses: focus/AppState-active/the 20s
  // poll/manual actions (cancel, retry payment) can all trigger
  // loadBooking() independently, with no cancellation between them. A
  // slower, earlier-issued request (e.g. a poll that started just before
  // a cancel) resolving AFTER a newer one (the reload right after that
  // cancel) would otherwise silently overwrite the correct, newer state
  // with stale data.
  const loadBookingRequestId = React.useRef(0);

  // Lets the polling interval below skip fetching once the booking reaches
  // a terminal state, without needing to recreate the interval itself (a
  // ref, not a dependency, so this always reads the current status rather
  // than the one captured when the interval was created).
  const bookingStatusRef = React.useRef<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const [retryLoading, setRetryLoading] = useState(false);

  const [cancelLoading, setCancelLoading] = useState(false);

  const [showTechnicianModal, setShowTechnicianModal] = useState(false);

  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoice, setInvoice] = useState<any>(null);
  const [invoiceError, setInvoiceError] = useState('');

  const [reviewsExpanded, setReviewsExpanded] = useState(false);
  const [draftRating, setDraftRating] = useState(0);
  const [draftReview, setDraftReview] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const toggleReviews = () => {
    LayoutAnimation.configureNext(
      LayoutAnimation.Presets.easeInEaseOut,
    );
    setReviewsExpanded(!reviewsExpanded);
  };

  // The QR flow (VerificationModal) calls this exact same submitReview()
  // service function — this is not a second review API, just a second
  // entry point into it. ERP enforces "one submission only" and rejects a
  // second call outright, so no client-side dedup logic is invented here.
  const onSubmitReview = async () => {
    if (draftRating < 1) {
      showError(t('pleaseSelectARating', language));
      return;
    }

    try {
      setSubmittingReview(true);

      const response = await submitReview(
        booking.id,
        draftRating,
        draftReview.trim(),
      );

      if (!response.success) {
        showError(response.message || 'Unable to submit review.');
        return;
      }

      setDraftRating(0);
      setDraftReview('');

      // Never fake the submitted review locally — reload from the backend
      // so the displayed rating/review always reflects what ERP stored.
      await loadBooking();

      showSuccess(
        t('reviewSubmittedSuccessfully', language),
      );
    } catch (error: any) {
      showError(
        error?.response?.data?.message ||
          t('unableToSubmitReview', language),
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  const onToggleInvoice = async () => {
    if (showInvoice) {
      setShowInvoice(false);
      return;
    }

    setShowInvoice(true);

    if (invoice || invoiceLoading) {
      return;
    }

    try {
      setInvoiceLoading(true);
      setInvoiceError('');

      const response = await getInvoice(booking.id);

      setInvoice(response.invoice);
    } catch (error: any) {
      setInvoiceError(
        error?.response?.data?.message ||
          t('unableToLoadInvoice', language),
      );
    } finally {
      setInvoiceLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadBooking();
    }, [bookingNumber]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        loadBooking();
      }
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      // Terminal bookings can no longer change — keep the interval alive
      // (simpler than tearing it down and recreating it) but skip the
      // actual network call once there's nothing left to refresh.
      if (
        bookingStatusRef.current === 'completed' ||
        bookingStatusRef.current === 'cancelled'
      ) {
        return;
      }

      loadBooking();
    }, 20000);

    return () => {
      clearInterval(interval);
    };
  }, [bookingNumber]);

  useEffect(() => {
    bookingStatusRef.current = booking?.status;
  }, [booking?.status]);

  const loadBooking = async () => {
    const requestId = ++loadBookingRequestId.current;

    try {
      const response = await getBookingById(bookingNumber);

      if (requestId !== loadBookingRequestId.current) {
        return;
      }

      setBooking(response.booking);
      updateBooking(response.booking);
    } catch (error) {
      console.log(error);
    } finally {
      if (requestId === loadBookingRequestId.current) {
        setLoading(false);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBooking();
    setRefreshing(false);
  };

  // ERP remains the source of truth — this only asks the backend to cancel,
  // then reloads. loadBooking() already calls updateBooking(), which syncs
  // the shared bookingStore.bookings array MyBookingsScreen reads from, so
  // a single reload here refreshes both this screen and booking history.
  const onCancelBooking = () => {
    showDialog({
      variant: 'warning',
      title: 'Cancel Booking?',
      description: 'Are you sure you want to cancel this booking?\n\nThis action cannot be undone.',
      buttons: [
        {text: 'Keep Booking', style: 'cancel'},
        {
          text: 'Cancel Booking',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancelLoading(true);

              const response = await cancelBooking(booking.id);

              if (!response.success) {
                showError(
                  response.message || 'Unable to cancel booking.',
                );
                return;
              }

              await loadBooking();

              showSuccess('Booking cancelled successfully.');
            } catch (error: any) {
              showError(
                error?.response?.data?.message ||
                  'Unable to cancel booking.',
              );
            } finally {
              setCancelLoading(false);
            }
          },
        },
      ],
    });
  };

  const retryPayment = async () => {

    // Same retry flow works for either gateway — only which checkout/verify
    // call is made differs. ERP stores Telr as 'teller' (hcp_booking.py).
    const isTelr = booking.paymentProvider === 'teller';
    const createCheckout = isTelr ? createTelrCheckout : createTamaraCheckout;
    const verifyPayment = isTelr ? verifyTelrPayment : verifyTamaraPayment;

    try {

      setRetryLoading(true);

      // Re-check the gateway's authoritative status before creating a
      // brand-new checkout session. Without this, a prior payment that
      // actually succeeded but the app never found out about (e.g. the
      // app was killed right after paying, before its own verify call
      // ran) would have a second checkout opened on retry — risking a
      // second real charge. confirmPayment (called inside verifyPayment)
      // is idempotent on gatewayOrderId, so this is safe even if the
      // prior attempt genuinely did fail.
      const precheck =
        await verifyPayment(
          booking.id,
        );

      if (
        precheck.paymentStatus ===
        'paid'
      ) {

        navigation.replace(
          'BookingSuccess',
          {
            paymentMethod:
              'ONLINE',
            paymentStatus:
              'PAID',
          },
        );

        return;

      }

      const response =
        await createCheckout(
          booking.id,
        );

      const checkoutUrl =
        response.checkoutUrl;

      const available =
        await InAppBrowser.isAvailable();

      if (available) {

        await InAppBrowser.openAuth(
          checkoutUrl,
          'homecareplus://payment',
          {
            dismissButtonStyle: 'close',
            showTitle: true,
            enableUrlBarHiding: true,
            enableDefaultShare: false,
          },
        );

      } else {

        await Linking.openURL(
          checkoutUrl,
        );

      }

      const verify =
        await pollPaymentStatus(
          verifyPayment,
          booking.id,
        );

      if (
        verify.paymentStatus ===
        'paid'
      ) {

        navigation.replace(
          'BookingSuccess',
          {
            paymentMethod:
              'ONLINE',
            paymentStatus:
              'PAID',
          },
        );

        return;

      }

      await loadBooking();

      if (
        verify.paymentStatus === 'failed'
      ) {
        return;
      }

    } catch (error) {

      console.log(error);

    } finally {

      setRetryLoading(false);

    }

  };

  const getTechnicianInitials = (name?: string) => {
    if (!name) {
      return '?';
    }

    const parts = name.trim().split(' ').filter(Boolean);

    if (parts.length === 0) {
      return '?';
    }

    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }

    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  const callTechnician = (phone?: string) => {
    if (!phone) {
      return;
    }

    Linking.openURL(`tel:${phone}`);
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <View style={styles.loaderCard}>
          <ActivityIndicator size="large" color="#4757E7" />
          <Text style={styles.loaderText}>
            {t('loadingDetails', language)}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Not found ─────────────────────────────────────────────────────────────
  if (!booking) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <View style={styles.loaderCard}>
          <View style={styles.notFoundIconWrap}>
            <Ionicons
              name="document-outline"
              size={40}
              color="#4757E7"
            />
          </View>
          <Text style={styles.notFoundTitle}>
            {t('bookingNotFound', language)}
          </Text>
          <TouchableOpacity
            style={styles.notFoundBackBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}>
            <Ionicons
              name={
                language === 'ar' ? 'arrow-forward' : 'arrow-back'
              }
              size={15}
              color="#4757E7"
            />
            <Text style={styles.notFoundBackText}>
              {t('goBack', language)}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isPaid = booking.paymentStatus === 'paid';
  const paymentStatusColor = isPaid ? '#22C55E' : '#F59E0B';
  const paymentStatusBg = isPaid ? '#F0FDF4' : '#FFFBEB';
  const paymentStatusBorder = isPaid ? '#BBF7D0' : '#FDE68A';

  const paymentMethodText =
    booking.paymentMethod === 'COD'
      ? t('cashOnDelivery', language)
      : booking.paymentProvider === 'tamara'
      ? 'Tamara'
      : booking.paymentProvider === 'teller'
      ? 'Telr'
      : t('onlinePayment', language);

  const paymentStatusText =
    booking.paymentStatus === 'paid'
      ? t('paid', language)
      : booking.paymentStatus === 'pending'
      ? t('pending', language)
      : booking.paymentStatus === 'failed'
      ? t('failed', language)
      : booking.paymentStatus;

  // This app is Saudi-only — every displayed date/time must render in
  // Asia/Riyadh regardless of the device's own timezone, or the same UTC
  // instant would show a different day/hour depending on where the phone
  // is set, which the customer never intended.
  const formattedDate = new Date(
    booking.bookingDate,
  ).toLocaleDateString(
    language === 'ar' ? 'ar-SA' : 'en-US',
    {day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Riyadh'},
  );

  const bookingCreatedDate = booking.createdAt
    ? new Date(booking.createdAt).toLocaleDateString(
        language === 'ar' ? 'ar-SA' : 'en-US',
        {day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Riyadh'},
      )
    : null;

  const paymentCompletedDate = booking.paidAt
    ? new Date(booking.paidAt).toLocaleDateString(
        language === 'ar' ? 'ar-SA' : 'en-US',
        {day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Riyadh'},
      )
    : null;

const hasCoordinates =
  booking.address?.latitude != null &&
  booking.address?.longitude != null;

  const openInMaps = () => {
    const lat = booking.address.latitude;
    const lng = booking.address.longitude;
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    Linking.openURL(url);
  };

  // A historical booking must always show what was true at booking time,
  // not the service/package/add-on's current live name — prefer ERP's
  // immutable priceSnapshot and only fall back to the live relation when
  // no snapshot is present (e.g. very old bookings).
  const snapshot = booking.priceSnapshot;

  const serviceName =
    getLocalizedText(snapshot?.serviceName, language) ||
    getLocalizedText(booking.service?.name, language);

  const packageName =
    getLocalizedText(snapshot?.packageName, language) ||
    getLocalizedText(booking.package?.name, language);

  const addOnNames = snapshot?.addOns?.length
    ? snapshot.addOns
        .map((item: any) =>
          language === 'ar'
            ? item.nameAr || item.nameEn
            : item.nameEn || item.nameAr,
        )
        .filter(Boolean)
    : (booking.addOns || [])
        .map((item: any) => getLocalizedText(item?.name, language))
        .filter(Boolean);

  const showOriginalAmount =
    booking.originalAmount > 0 &&
    booking.originalAmount !== booking.finalAmount;
  const showDiscount = booking.discountAmount > 0;

  const technician = booking.technician;
  const technicianHasRating =
    !!technician?.rating && technician.rating > 0;
  // ERP's `experience` is a free-form description (e.g. "5 years in
  // cleaning services"), not a number — a numeric comparison here always
  // evaluated to false, hiding the badge even when experience was set.
  const technicianHasExperience = !!technician?.experience;
  const technicianHasLanguages =
    !!technician?.languages &&
    Array.isArray(technician.languages) &&
    technician.languages.length > 0;

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4757E7"
            colors={['#4757E7']}
          />
        }
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* ── Hero card ── */}
        <View style={styles.heroCard}>

          {/* Back button + service name */}
          <View style={styles.heroTop}>
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
                size={22}
                color={colors.textPrimary}
              />
            </TouchableOpacity>

            <View style={styles.heroTextBlock}>
              <Text style={styles.title} numberOfLines={2}>
                {serviceName}
              </Text>

              <View style={styles.bookingRow}>
                <View style={styles.bookingIdRow}>
                  <Ionicons
                    name="receipt-outline"
                    size={13}
                    color={colors.textHint}
                  />
                  <Text style={styles.bookingNo}>
                    #{booking.bookingNumber}
                  </Text>
                </View>

                <StatusBadge status={booking.status} />
              </View>
            </View>
          </View>

          {/* Stats strip */}
          <View style={styles.heroBottom}>
            <View style={styles.heroStat}>
              <View style={styles.heroStatIconWrap}>
                <Ionicons
                  name="calendar-outline"
                  size={15}
                  color="#4757E7"
                />
              </View>
              <View style={styles.heroStatTextBlock}>
                <Text style={styles.heroLabel}>
                  {t('serviceDate', language)}
                </Text>
                <Text style={styles.heroValue} numberOfLines={1}>
                  {formattedDate}
                </Text>
              </View>
            </View>

            <View style={styles.heroStatDivider} />

            <View style={styles.heroStat}>
              <View style={[
                styles.heroStatIconWrap,
                {backgroundColor: paymentStatusBg},
              ]}>
                <Ionicons
                  name={
                    isPaid
                      ? 'checkmark-circle-outline'
                      : 'time-outline'
                  }
                  size={15}
                  color={paymentStatusColor}
                />
              </View>
              <View style={styles.heroStatTextBlock}>
                <Text style={styles.heroLabel}>
                  {t('payment', language)}
                </Text>
                <View style={[
                  styles.payStatusPill,
                  {
                    backgroundColor: paymentStatusBg,
                    borderColor: paymentStatusBorder,
                  },
                ]}>
                  <View style={[
                    styles.payStatusDot,
                    {backgroundColor: paymentStatusColor},
                  ]} />
                  <Text style={[
                    styles.payStatusText,
                    {color: paymentStatusColor},
                  ]}>
                    {paymentStatusText}
                  </Text>
                </View>
              </View>
            </View>
          </View>

        </View>

        {/* ── Cancellation notice ── */}
        {booking.status === 'cancelled' && booking.cancellationReason && (
          <View style={[styles.failureReasonBox, {marginBottom: 16}]}>
            <Ionicons name="alert-circle-outline" size={14} color="#DC2626" />
            <Text style={styles.failureReasonText}>
              {booking.cancellationReason === 'NO_TECHNICIAN_AVAILABLE'
                ? t('cancellationNoTechnician', language)
                : booking.cancellationReason}
            </Text>
          </View>
        )}

        {/* ── Booking progress / timeline ── */}
        <SectionCard title={t('bookingProgress', language)}>
          <BookingTimeline status={booking.status} />
        </SectionCard>

        {/* ── Service Details ── */}
        <SectionCard title={t('serviceDetails', language)}>

          <View style={styles.serviceHeaderRow}>
            <View style={styles.serviceIconWrap}>
              <Ionicons name="construct-outline" size={16} color="#4757E7" />
            </View>
            <View style={styles.serviceHeaderTextBlock}>
              <Text style={styles.serviceNameText} numberOfLines={2}>
                {serviceName}
              </Text>
              {packageName ? (
                <Text style={styles.servicePackageText} numberOfLines={1}>
                  {packageName}
                </Text>
              ) : null}
            </View>
          </View>

          {addOnNames.length > 0 && (
            <View style={styles.addOnsWrap}>
              <Text style={styles.addOnsLabel}>
                {t('addons', language)}
              </Text>
              <View style={styles.addOnsChipRow}>
                {addOnNames.map((name: string, index: number) => (
                  <View key={index} style={styles.addOnChip}>
                    <Ionicons name="add-circle-outline" size={12} color="#4757E7" />
                    <Text style={styles.addOnChipText} numberOfLines={1}>
                      {name}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.amountDivider} />

          {showOriginalAmount && (
            <DetailRow
              label={t('originalAmount', language)}
              value={`${t('currency', language)} ${booking.originalAmount}`}
            />
          )}

          {showDiscount && (
            <View style={styles.discountRow}>
              <Text style={styles.discountLabel}>
                {t('discount', language)}
              </Text>
              <Text style={styles.discountValue}>
                − {t('currency', language)} {booking.discountAmount}
              </Text>
            </View>
          )}

          <View style={styles.finalAmountRow}>
            <Text style={styles.finalAmountLabel}>
              {t('finalAmount', language)}
            </Text>
            <Text style={styles.finalAmountValue}>
              {t('currency', language)} {booking.finalAmount ?? booking.totalAmount}
            </Text>
          </View>

        </SectionCard>

        {/* ── Booking Information ── */}
        <SectionCard title={t('bookingInformation', language)}>

          <View style={styles.infoGrid}>

            <View style={styles.infoCell}>
              <View style={styles.infoIconWrap}>
                <Ionicons name="receipt-outline" size={14} color="#4757E7" />
              </View>
              <View style={styles.infoTextBlock}>
                <Text style={styles.infoLabel}>
                  {t('bookingNumber', language)}
                </Text>
                <Text style={styles.infoValue} numberOfLines={1}>
                  #{booking.bookingNumber}
                </Text>
              </View>
            </View>

            {bookingCreatedDate && (
              <View style={styles.infoCell}>
                <View style={styles.infoIconWrap}>
                  <Ionicons name="document-text-outline" size={14} color="#4757E7" />
                </View>
                <View style={styles.infoTextBlock}>
                  <Text style={styles.infoLabel}>
                    {t('bookingDate', language)}
                  </Text>
                  <Text style={styles.infoValue} numberOfLines={1}>
                    {bookingCreatedDate}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.infoCell}>
              <View style={styles.infoIconWrap}>
                <Ionicons name="calendar-outline" size={14} color="#4757E7" />
              </View>
              <View style={styles.infoTextBlock}>
                <Text style={styles.infoLabel}>
                  {t('serviceDate', language)}
                </Text>
                <Text style={styles.infoValue} numberOfLines={1}>
                  {formattedDate}
                </Text>
              </View>
            </View>

            {booking.timeSlot && (
              <View style={styles.infoCell}>
                <View style={styles.infoIconWrap}>
                  <Ionicons name="time-outline" size={14} color="#4757E7" />
                </View>
                <View style={styles.infoTextBlock}>
                  <Text style={styles.infoLabel}>
                    {t('timeSlot', language)}
                  </Text>
                  <Text style={styles.infoValue} numberOfLines={1}>
                    {booking.timeSlot}
                  </Text>
                </View>
              </View>
            )}

          </View>

        </SectionCard>

        {/* ── Cancel Booking ── */}
        {['pending', 'pending_assignment', 'assigned'].includes(
          booking.status,
        ) && (
          <TouchableOpacity
            style={[
              styles.cancelBookingButton,
              cancelLoading && styles.cancelBookingButtonDisabled,
            ]}
            activeOpacity={0.85}
            disabled={cancelLoading}
            onPress={onCancelBooking}>
            {cancelLoading ? (
              <ActivityIndicator color="#DC2626" />
            ) : (
              <>
                <Ionicons
                  name="close-circle-outline"
                  size={18}
                  color="#DC2626"
                />
                <Text style={styles.cancelBookingButtonText}>
                  Cancel Booking
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* ── Address ── */}
        <SectionCard title={t('address', language)}>
          <View style={styles.addressRow}>
            <View style={styles.addressIconWrap}>
              <Ionicons
                name="location"
                size={16}
                color="#4757E7"
              />
            </View>
            <Text style={styles.value}>
              {[booking.address?.fullAddress, booking.address?.city, booking.address?.region]
                .filter(Boolean)
                .join(', ')}
            </Text>
          </View>

          {/* Contact snapshot at booking time — may differ from the
              customer's current profile name/phone; this is intentional. */}
          {(booking.bookingContactName || booking.bookingContactPhone) && (
            <DetailRow
              label={t('contact', language)}
              value={
                [booking.bookingContactName, booking.bookingContactPhone]
                  .filter(Boolean)
                  .join(' • ')
              }
            />
          )}

          {hasCoordinates && (
            <TouchableOpacity
              style={styles.mapsButton}
              activeOpacity={0.8}
              onPress={openInMaps}>
              <Ionicons name="navigate-outline" size={15} color="#4757E7" />
              <Text style={styles.mapsButtonText}>
                {t('openInMaps', language)}
              </Text>
            </TouchableOpacity>
          )}
        </SectionCard>

        {/* ── Partner ── */}
        <SectionCard title={t('partner', language)}>
          {technician ? (
            <>
              <TouchableOpacity
                style={styles.technicianCard}
                activeOpacity={0.85}
                onPress={() => setShowTechnicianModal(true)}>

                {technician.image ? (
                  <Image
                    source={{uri: technician.image}}
                    style={styles.technicianAvatarImage}
                  />
                ) : (
                  <View style={styles.technicianAvatarFallback}>
                    <Text style={styles.technicianAvatarInitials}>
                      {getTechnicianInitials(technician.name)}
                    </Text>
                  </View>
                )}

                <View style={styles.technicianCardTextBlock}>
                  <View style={styles.technicianNameRow}>
                    <Text style={styles.technicianNameText} numberOfLines={1}>
                      {technician.name || '-'}
                    </Text>
                    {technicianHasRating && (
                      <View style={styles.technicianRatingPill}>
                        <Ionicons name="star" size={11} color="#F59E0B" />
                        <Text style={styles.technicianRatingText}>
                          {technician.rating}
                        </Text>
                      </View>
                    )}
                  </View>

                  {technician.specialization ? (
                    <View style={styles.technicianMetaRow}>
                      <Ionicons name="construct-outline" size={12} color={colors.textSecondary} />
                      <Text style={styles.technicianMetaText} numberOfLines={1}>
                        {technician.specialization}
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.technicianBadgeRow}>
                    {technicianHasExperience && (
                      <View style={styles.technicianBadge}>
                        <Ionicons name="time-outline" size={11} color="#4757E7" />
                        <Text style={styles.technicianBadgeText} numberOfLines={1}>
                          {technician.experience}
                        </Text>
                      </View>
                    )}

                    {technicianHasLanguages && (
                      <View style={styles.technicianBadge}>
                        <Ionicons name="globe-outline" size={11} color="#4757E7" />
                        <Text style={styles.technicianBadgeText} numberOfLines={1}>
                          {technician.languages.join(' • ')}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <Ionicons
                  name={
                    language === 'ar'
                      ? 'chevron-back-outline'
                      : 'chevron-forward-outline'
                  }
                  size={18}
                  color="#CBD5E1"
                />

              </TouchableOpacity>

              {technician.phone ? (
                <TouchableOpacity
                  style={styles.callTechnicianButton}
                  activeOpacity={0.85}
                  onPress={() => callTechnician(technician.phone)}>
                  <Ionicons name="call-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.callTechnicianButtonText}>
                    {t('callTechnician', language)}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </>
          ) : (
            <View style={styles.technicianPlaceholder}>
              <View style={styles.technicianPlaceholderIconWrap}>
                <Ionicons name="person-outline" size={20} color={colors.textHint} />
              </View>
              <Text style={styles.technicianPlaceholderText}>
                {t('technicianWillBeAssigned', language)}
              </Text>
            </View>
          )}
        </SectionCard>

        {/* ── Payment ── */}
        <SectionCard title={t('payment', language)}>
          <DetailRow
            label={t('method', language)}
            value={paymentMethodText}
          />

          {showOriginalAmount && (
            <DetailRow
              label={t('originalAmount', language)}
              value={`${t('currency', language)} ${booking.originalAmount}`}
            />
          )}

          {showDiscount && (
            <View style={styles.discountRow}>
              <Text style={styles.discountLabel}>
                {t('discount', language)}
              </Text>
              <Text style={styles.discountValue}>
                − {t('currency', language)} {booking.discountAmount}
              </Text>
            </View>
          )}

          <DetailRow
            label={t('finalAmount', language)}
            value={`${t('currency', language)} ${booking.finalAmount ?? booking.totalAmount}`}
          />

          <View style={styles.paymentStatusDetailRow}>
            <Text style={styles.label}>
              {t('status', language)}
            </Text>
            <View style={[
              styles.miniStatusPill,
              {backgroundColor: paymentStatusBg, borderColor: paymentStatusBorder},
            ]}>
              <View style={[styles.payStatusDot, {backgroundColor: paymentStatusColor}]} />
              <Text style={[styles.miniStatusText, {color: paymentStatusColor}]}>
                {paymentStatusText}
              </Text>
            </View>
          </View>

          {booking.paymentReference && (
            <DetailRow
              label={t('transactionReference', language)}
              value={booking.paymentReference}
            />
          )}

          {paymentCompletedDate && (
            <DetailRow
              label={t('paymentCompletedOn', language)}
              value={paymentCompletedDate}
            />
          )}

          {booking.paymentStatus === 'failed' && booking.paymentFailureReason && (
            <View style={styles.failureReasonBox}>
              <Ionicons name="alert-circle-outline" size={14} color="#DC2626" />
              <Text style={styles.failureReasonText}>
                {booking.paymentFailureReason}
              </Text>
            </View>
          )}
        </SectionCard>

        {/* ── Retry / Continue Payment ── */}
        {booking.paymentMethod === 'ONLINE' &&
          ['tamara', 'teller'].includes(booking.paymentProvider) &&
          booking.paymentStatus !== 'paid' &&
          // A booking moves 'pending' → 'pending_assignment' automatically
          // and near-instantly after creation (ERP's action_broadcast) —
          // by the time the customer sees this screen it's almost always
          // already 'pending_assignment', not 'pending'.
          ['pending', 'pending_assignment'].includes(booking.status) && (

            <SectionCard title={t('payment', language)}>

              <View style={styles.retryWarningBox}>
                <View style={styles.retryWarningIconWrap}>
                  <Ionicons
                    name={
                      booking.paymentStatus === 'failed'
                        ? 'close-circle-outline'
                        : 'time-outline'
                    }
                    size={18}
                    color="#DC2626"
                  />
                </View>
                <View style={styles.retryWarningTextBlock}>
                  <Text style={styles.retryWarningTitle}>
                    {booking.paymentStatus === 'failed'
                      ? t('paymentFailed', language)
                      : t('paymentPending', language)}
                  </Text>
                  <Text style={styles.retryWarningSubtitle}>
                    {booking.paymentFailureReason ||
                      t('completePaymentToConfirm', language)}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={retryPayment}
                disabled={retryLoading}
                activeOpacity={0.85}
                style={[
                  styles.retryButton,
                  retryLoading && styles.retryButtonDisabled,
                ]}>
                {retryLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons
                      name={
                        booking.paymentStatus === 'failed'
                          ? 'refresh-outline'
                          : 'arrow-forward-circle-outline'
                      }
                      size={18}
                      color="#FFFFFF"
                    />
                    <Text style={styles.retryButtonText}>
                      {booking.paymentStatus === 'failed'
                        ? t('retryPayment', language)
                        : t('continuePayment', language)}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

            </SectionCard>

        )}

        {/* ── Verification (assigned only) ── */}
        {[
          'assigned',
          'on_the_way',
          'in_progress',
        ].includes(booking.status) && (
          <SectionCard title={t('verification', language)}>
            <View style={styles.verificationInfoRow}>
              <Ionicons
                name="information-circle-outline"
                size={16}
                color={colors.textSecondary}
              />
              <Text style={styles.info}>
                {t('verificationInfo', language)}.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.qrButton}
              activeOpacity={0.85}
              onPress={() => setShowQR(true)}>
              <Ionicons
                name="qr-code-outline"
                size={18}
                color="#FFFFFF"
              />
              <Text style={styles.qrButtonText}>
                {t('showVerificationQR', language)}
              </Text>
            </TouchableOpacity>
          </SectionCard>
        )}

        {/* ── Ratings & Reviews ── */}
        <View style={styles.reviewsCard}>
          <TouchableOpacity
            style={styles.premiumHeader}
            activeOpacity={0.75}
            onPress={toggleReviews}>
            <View style={styles.premiumHeaderLeft}>
              <View style={styles.reviewsIconWrap}>
                <Ionicons name="star" size={17} color="#F59E0B" />
              </View>
              <View style={styles.premiumHeaderTextBlock}>
                <Text style={styles.premiumHeaderTitle}>
                  {t('ratingsAndReviews', language)}
                </Text>
                <Text style={styles.premiumHeaderSubtitle}>
                  {t('shareYourExperience', language)}
                </Text>
              </View>
            </View>
            <AnimatedChevron
              expanded={reviewsExpanded}
              color={colors.textHint}
            />
          </TouchableOpacity>

          {reviewsExpanded && (
            <View style={styles.reviewsBody}>
              {!technician ? (
                <View style={styles.infoNoticeBox}>
                  <Ionicons
                    name="information-circle-outline"
                    size={16}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.info}>
                    {t('ratingsAvailableAfterAssignment', language)}
                  </Text>
                </View>
              ) : booking.status !== 'completed' ? (
                <View style={styles.infoNoticeBox}>
                  <Ionicons
                    name="information-circle-outline"
                    size={16}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.info}>
                    {t('ratingsAvailableAfterCompletion', language)}
                  </Text>
                </View>
              ) : booking.reviewSubmitted ? (
                <View style={styles.submittedReviewBox}>
                  <Text style={styles.submittedReviewLabel}>
                    {t('submittedReview', language)}
                  </Text>

                  <View style={styles.submittedStarsRow}>
                    {[1, 2, 3, 4, 5].map(item => (
                      <Ionicons
                        key={item}
                        name={
                          item <= (booking.rating || 0)
                            ? 'star-sharp'
                            : 'star-outline'
                        }
                        size={22}
                        color={
                          item <= (booking.rating || 0)
                            ? '#F59E0B'
                            : '#CBD5E1'
                        }
                      />
                    ))}
                  </View>

                  {booking.review ? (
                    <Text style={styles.submittedReviewText}>
                      "{booking.review}"
                    </Text>
                  ) : null}
                </View>
              ) : (
                <>
                  <StarRating
                    rating={draftRating}
                    onChange={setDraftRating}
                  />

                  <TextInput
                    style={styles.reviewInput}
                    placeholder={t('writeYourReview', language)}
                    placeholderTextColor={colors.textHint}
                    value={draftReview}
                    onChangeText={setDraftReview}
                    multiline
                    maxLength={500}
                  />

                  <TouchableOpacity
                    style={[
                      styles.qrButton,
                      (draftRating === 0 || submittingReview) &&
                        styles.retryButtonDisabled,
                    ]}
                    activeOpacity={0.85}
                    disabled={draftRating === 0 || submittingReview}
                    onPress={onSubmitReview}>
                    {submittingReview ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons
                          name="star-outline"
                          size={18}
                          color="#FFFFFF"
                        />
                        <Text style={styles.qrButtonText}>
                          {t('submitReview', language)}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </View>

        {/* ── Invoice (after completion) ── */}
        {booking.status === 'completed' && (
          <View style={styles.reviewsCard}>
            <View style={styles.premiumHeader}>
              <View style={styles.premiumHeaderLeft}>
                <View style={styles.invoiceIconWrap}>
                  <Ionicons name="document-text" size={17} color="#4757E7" />
                </View>
                <Text style={styles.premiumHeaderTitle}>
                  {t('invoice', language)}
                </Text>
              </View>
            </View>

            <View style={styles.reviewsBody}>
              <TouchableOpacity
                style={styles.qrButton}
                activeOpacity={0.85}
                onPress={onToggleInvoice}>
                <Ionicons
                  name={showInvoice ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={styles.qrButtonText}>
                  {showInvoice
                    ? t('hideInvoice', language)
                    : t('viewInvoice', language)}
                </Text>
              </TouchableOpacity>

              {showInvoice && (
                <View style={styles.invoiceBox}>
                  {invoiceLoading ? (
                    <ActivityIndicator color="#4757E7" />
                  ) : invoiceError ? (
                    <View style={styles.invoiceErrorRow}>
                      <Ionicons
                        name="alert-circle-outline"
                        size={16}
                        color="#DC2626"
                      />
                      <Text style={styles.invoiceErrorText}>
                        {invoiceError}
                      </Text>
                    </View>
                  ) : invoice ? (
                    <>
                      {invoice.invoiceNumber && (
                        <DetailRow
                          label={t('invoiceNumber', language)}
                          value={String(invoice.invoiceNumber)}
                        />
                      )}
                      {invoice.invoiceDate && (
                        <DetailRow
                          label={t('invoiceDate', language)}
                          value={String(invoice.invoiceDate)}
                        />
                      )}
                      {invoice.amount != null && (
                        <DetailRow
                          label={t('finalAmount', language)}
                          value={`${t('currency', language)} ${invoice.amount}`}
                        />
                      )}
                    </>
                  ) : (
                    <View style={styles.invoiceErrorRow}>
                      <Ionicons
                        name="document-outline"
                        size={16}
                        color={colors.textSecondary}
                      />
                      <Text style={styles.info}>
                        {t('invoiceUnavailable', language)}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        )}

        {/* ── Back to home ── */}
        <TouchableOpacity
          activeOpacity={0.75}
          style={styles.homeBtn}
          onPress={() => navigation.navigate('Home')}>
          <Ionicons
            name={
              language === 'ar' ? 'arrow-forward' : 'arrow-back'
            }
            size={16}
            color={colors.primary}
          />
          <Text style={styles.homeBtnText}>
            {t('backToHome', language)}
          </Text>
        </TouchableOpacity>

      </ScrollView>

      <VerificationModal
        visible={showQR}
        bookingId={booking?.id}
        qrToken={booking?.qrToken ?? ''}
        bookingNumber={booking?.bookingNumber ?? ''}
        status={booking?.status ?? 'pending'}
        reviewSubmitted={booking?.reviewSubmitted ?? false}
        onClose={() => setShowQR(false)}
        onReviewSubmitted={() => {
          loadBooking();
        }}
      />

      {/* ── Technician Detail Modal ── */}
      <Modal
        visible={showTechnicianModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTechnicianModal(false)}>
        <View style={styles.technicianModalOverlay}>
          <View style={styles.technicianModalCard}>

            <TouchableOpacity
              style={styles.technicianModalCloseBtn}
              activeOpacity={0.7}
              onPress={() => setShowTechnicianModal(false)}>
              <Ionicons name="close" size={20} color={colors.textPrimary} />
            </TouchableOpacity>

            {technician?.image ? (
              <Image
                source={{uri: technician.image}}
                style={styles.technicianModalAvatarImage}
              />
            ) : (
              <View style={styles.technicianModalAvatarFallback}>
                <Text style={styles.technicianModalAvatarInitials}>
                  {getTechnicianInitials(technician?.name)}
                </Text>
              </View>
            )}

            <Text style={styles.technicianModalName} numberOfLines={1}>
              {technician?.name || '-'}
            </Text>

            {technicianHasRating && (
              <View style={styles.technicianModalRatingPill}>
                <Ionicons name="star" size={13} color="#F59E0B" />
                <Text style={styles.technicianModalRatingText}>
                  {technician.rating} {t('rating', language)}
                </Text>
              </View>
            )}

            <View style={styles.technicianModalDivider} />

            <View style={styles.technicianModalDetails}>

              {technician?.phone ? (
                <View style={styles.technicianModalDetailRow}>
                  <View style={styles.technicianModalDetailIconWrap}>
                    <Ionicons name="call-outline" size={14} color="#4757E7" />
                  </View>
                  <Text style={styles.technicianModalDetailText} numberOfLines={1}>
                    {technician.phone}
                  </Text>
                </View>
              ) : null}

              {technician?.email ? (
                <View style={styles.technicianModalDetailRow}>
                  <View style={styles.technicianModalDetailIconWrap}>
                    <Ionicons name="mail-outline" size={14} color="#4757E7" />
                  </View>
                  <Text style={styles.technicianModalDetailText} numberOfLines={1}>
                    {technician.email}
                  </Text>
                </View>
              ) : null}

              {technician?.specialization ? (
                <View style={styles.technicianModalDetailRow}>
                  <View style={styles.technicianModalDetailIconWrap}>
                    <Ionicons name="construct-outline" size={14} color="#4757E7" />
                  </View>
                  <Text style={styles.technicianModalDetailText} numberOfLines={1}>
                    {technician.specialization}
                  </Text>
                </View>
              ) : null}

              {technicianHasExperience && (
                <View style={styles.technicianModalDetailRow}>
                  <View style={styles.technicianModalDetailIconWrap}>
                    <Ionicons name="time-outline" size={14} color="#4757E7" />
                  </View>
                  <Text style={styles.technicianModalDetailText} numberOfLines={1}>
                    {technician.experience}
                  </Text>
                </View>
              )}

              {technicianHasLanguages && (
                <View style={styles.technicianModalDetailRow}>
                  <View style={styles.technicianModalDetailIconWrap}>
                    <Ionicons name="globe-outline" size={14} color="#4757E7" />
                  </View>
                  <Text style={styles.technicianModalDetailText} numberOfLines={1}>
                    {technician.languages.join(' • ')}
                  </Text>
                </View>
              )}

            </View>

            {technician?.phone ? (
              <TouchableOpacity
                style={styles.technicianModalCallButton}
                activeOpacity={0.85}
                onPress={() => callTechnician(technician.phone)}>
                <Ionicons name="call-outline" size={16} color="#FFFFFF" />
                <Text style={styles.technicianModalCallButtonText}>
                  {t('callTechnician', language)}
                </Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={styles.technicianModalCloseTextBtn}
              activeOpacity={0.7}
              onPress={() => setShowTechnicianModal(false)}>
              <Text style={styles.technicianModalCloseTextBtnText}>
                {t('close', language)}
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

export default BookingDetailsScreen;

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 48,
  },

  // ── Loader / Not-found ────────────────────────────────────────────────────
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
    paddingVertical: 44,
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

  notFoundIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  notFoundTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: 'center',
  },

  notFoundBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },

  notFoundBackText: {
    color: '#4757E7',
    fontFamily: Fonts.semiBold,
    fontSize: 14,
  },

  // ── Hero card ─────────────────────────────────────────────────────────────
  heroCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#64748B',
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 4},
    elevation: 4,
  },

  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    marginTop: 2,
  },

  heroTextBlock: {
    flex: 1,
  },

  title: {
    fontSize: 22,
    fontFamily: Fonts.bold,
    color: colors.textPrimary,
    letterSpacing: -0.3,
    lineHeight: 28,
  },

  bookingRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  bookingIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  bookingNo: {
    color: colors.textHint,
    fontSize: 12,
    fontFamily: Fonts.medium,
  },

  // ── Hero bottom stats strip ───────────────────────────────────────────────
  heroBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    gap: 16,
  },

  heroStat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  heroStatTextBlock: {
    flex: 1,
  },

  heroStatIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

  heroStatDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
  },

  heroLabel: {
    color: colors.textHint,
    fontSize: 11,
    fontFamily: Fonts.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },

  heroValue: {
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },

  payStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },

  payStatusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },

  payStatusText: {
    fontSize: 11,
    fontFamily: Fonts.semiBold,
  },

  // ── Service Details ───────────────────────────────────────────────────────
  serviceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 14,
  },

  serviceIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 1,
  },

  serviceHeaderTextBlock: {
    flex: 1,
  },

  serviceNameText: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
    color: colors.textPrimary,
    lineHeight: 20,
  },

  servicePackageText: {
    marginTop: 3,
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: colors.textSecondary,
  },

  addOnsWrap: {
    marginBottom: 14,
  },

  addOnsLabel: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: colors.textHint,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },

  addOnsChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  addOnChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    maxWidth: 200,
  },

  addOnChipText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: '#4757E7',
  },

  amountDivider: {
    height: 1,
    backgroundColor: colors.backgroundSecondary,
    marginBottom: 14,
  },

  discountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  discountLabel: {
    fontSize: 14,
    color: '#22C55E',
    fontFamily: Fonts.medium,
  },

  discountValue: {
    fontSize: 14,
    color: '#22C55E',
    fontFamily: Fonts.semiBold,
  },

  finalAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },

  finalAmountLabel: {
    fontSize: 15,
    color: colors.textPrimary,
    fontFamily: Fonts.semiBold,
  },

  finalAmountValue: {
    fontSize: 18,
    color: '#4757E7',
    fontFamily: Fonts.bold,
  },

  // ── Booking Information grid ──────────────────────────────────────────────
  infoGrid: {
    gap: 14,
  },

  infoCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  infoIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

  infoTextBlock: {
    flex: 1,
  },

  infoLabel: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: colors.textHint,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },

  infoValue: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: colors.textPrimary,
  },

  // ── Address ───────────────────────────────────────────────────────────────
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },

  addressIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 1,
  },

  value: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    fontFamily: Fonts.medium,
    lineHeight: 22,
  },

  mapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 14,
    backgroundColor: '#EEF2FF',
    paddingVertical: 11,
    borderRadius: 12,
  },

  mapsButtonText: {
    color: '#4757E7',
    fontSize: 13,
    fontFamily: Fonts.semiBold,
  },

  // ── Technician card (Partner section) ───────────────────────────────────────
  technicianCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.divider,
  },

  technicianAvatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EEF2FF',
  },

  technicianAvatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4757E7',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

  technicianAvatarInitials: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: Fonts.bold,
  },

  technicianCardTextBlock: {
    flex: 1,
    gap: 5,
  },

  technicianNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  technicianNameText: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
    color: colors.textPrimary,
    flexShrink: 1,
  },

  technicianRatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 20,
  },

  technicianRatingText: {
    fontSize: 11,
    fontFamily: Fonts.semiBold,
    color: '#B45309',
  },

  technicianMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  technicianMetaText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: colors.textSecondary,
    flexShrink: 1,
  },

  technicianBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },

  technicianBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    maxWidth: 180,
  },

  technicianBadgeText: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: '#4757E7',
  },

  callTechnicianButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4757E7',
    borderRadius: 14,
    paddingVertical: 13,
    marginTop: 12,
    shadowColor: '#4757E7',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 4},
    elevation: 5,
  },

  callTechnicianButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },

  // ── Technician modal ─────────────────────────────────────────────────────
  technicianModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  technicianModalCard: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 28,
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
    shadowColor: '#020617',
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: {width: 0, height: 10},
    elevation: 12,
  },

  technicianModalCloseBtn: {
    alignSelf: 'flex-end',
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },

  technicianModalAvatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#EEF2FF',
    marginBottom: 14,
  },

  technicianModalAvatarFallback: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#4757E7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },

  technicianModalAvatarInitials: {
    color: '#FFFFFF',
    fontSize: 30,
    fontFamily: Fonts.bold,
  },

  technicianModalName: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: colors.textPrimary,
    marginBottom: 8,
  },

  technicianModalRatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 6,
  },

  technicianModalRatingText: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    color: '#B45309',
  },

  technicianModalDivider: {
    height: 1,
    width: '100%',
    backgroundColor: colors.backgroundSecondary,
    marginVertical: 16,
  },

  technicianModalDetails: {
    width: '100%',
    gap: 14,
    marginBottom: 18,
  },

  technicianModalDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  technicianModalDetailIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

  technicianModalDetailText: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: colors.textPrimary,
  },

  technicianModalCallButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4757E7',
    borderRadius: 14,
    paddingVertical: 15,
    marginBottom: 10,
    shadowColor: '#4757E7',
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 4},
    elevation: 6,
  },

  technicianModalCallButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: Fonts.semiBold,
  },

  technicianModalCloseTextBtn: {
    paddingVertical: 8,
  },

  technicianModalCloseTextBtnText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: colors.textSecondary,
  },

  // ── Technician placeholder ─────────────────────────────────────────────────
  technicianPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.divider,
    borderStyle: 'dashed',
  },

  technicianPlaceholderIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

  technicianPlaceholderText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.medium,
    color: colors.textSecondary,
    lineHeight: 19,
  },

  // ── Payment card extras ────────────────────────────────────────────────────
  label: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: Fonts.medium,
  },

  paymentStatusDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  miniStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },

  miniStatusText: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
  },

  failureReasonBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
  },

  failureReasonText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: '#DC2626',
    lineHeight: 18,
  },

  // ── Retry payment ──────────────────────────────────────────────────────────
  retryWarningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },

  retryWarningIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

  retryWarningTextBlock: {
    flex: 1,
  },

  retryWarningTitle: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: '#DC2626',
    marginBottom: 3,
  },

  retryWarningSubtitle: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: colors.textSecondary,
    lineHeight: 18,
  },

  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4757E7',
    borderRadius: 14,
    paddingVertical: 16,
    shadowColor: '#4757E7',
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 4},
    elevation: 6,
  },

  retryButtonDisabled: {
    opacity: 0.7,
  },

  retryButtonText: {
    color: '#FFFFFF',
    fontFamily: Fonts.semiBold,
    fontSize: 15,
  },

  // ── Verification ──────────────────────────────────────────────────────────
  verificationInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 16,
  },

  info: {
    flex: 1,
    color: colors.textSecondary,
    lineHeight: 22,
    fontFamily: Fonts.regular,
    fontSize: 14,
  },

  qrButton: {
    backgroundColor: '#4757E7',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#4757E7',
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 4},
    elevation: 6,
  },

  qrButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: Fonts.semiBold,
  },

  homeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 8,
    backgroundColor: `${colors.primary}1A`,
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
    paddingVertical: 14,
    borderRadius: 14,
  },

  homeBtnText: {
    color: colors.primary,
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },

  invoiceBox: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.background,
  },

  cancelBookingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 54,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },

  cancelBookingButtonDisabled: {
    opacity: 0.6,
  },

  cancelBookingButtonText: {
    color: '#DC2626',
    fontSize: 15,
    fontFamily: Fonts.semiBold,
  },

  // ── Ratings & Reviews ─────────────────────────────────────────────────────
  reviewsCard: {
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 5},
    elevation: 3,
  },

  // Shared premium accordion/card header — reused by both the Ratings &
  // Reviews accordion and the Invoice card for a consistent, elevated feel.
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },

  premiumHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },

  premiumHeaderTextBlock: {
    flex: 1,
  },

  premiumHeaderTitle: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
    color: colors.textPrimary,
  },

  premiumHeaderSubtitle: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: colors.textHint,
  },

  reviewsIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#FFFBEB',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

  invoiceIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },

  reviewsBody: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    gap: 16,
  },

  infoNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 14,
  },

  submittedReviewBox: {
    gap: 10,
  },

  submittedReviewLabel: {
    fontSize: 11,
    fontFamily: Fonts.medium,
    color: colors.textHint,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  submittedStarsRow: {
    flexDirection: 'row',
    gap: 6,
  },

  submittedReviewText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    fontStyle: 'italic',
    color: colors.textPrimary,
    lineHeight: 21,
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.divider,
  },

  invoiceErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  invoiceErrorText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: '#DC2626',
    lineHeight: 18,
  },

  reviewInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    minHeight: 90,
    textAlignVertical: 'top',
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
});